-- PHASE 3 — INVITER ENGINE (accès privés, claim, réconciliation)

CREATE TYPE public.invitation_status AS ENUM (
  'created',
  'distributed',
  'opened',
  'claimed',
  'scanned',
  'expired',
  'cancelled'
);

CREATE TYPE public.distribution_channel AS ENUM ('whatsapp', 'email');

-- Types d'accès par événement (INVITER)
CREATE TABLE public.access_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  max_guests INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, code)
);

CREATE INDEX idx_access_types_event ON public.access_types (event_id);

-- Enrichissement invitations
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS guest_first_name TEXT,
  ADD COLUMN IF NOT EXISTS guest_last_name TEXT,
  ADD COLUMN IF NOT EXISTS guest_phone TEXT,
  ADD COLUMN IF NOT EXISTS access_type_code TEXT NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS unique_code TEXT,
  ADD COLUMN IF NOT EXISTS qr_payload TEXT,
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS distributed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS distribution_channels public.distribution_channel[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS claimed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

UPDATE public.invitations SET unique_code = token WHERE unique_code IS NULL;

ALTER TABLE public.invitations
  ALTER COLUMN unique_code SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_invitations_unique_code ON public.invitations (unique_code);
CREATE INDEX IF NOT EXISTS idx_invitations_phone ON public.invitations (guest_phone);
CREATE INDEX IF NOT EXISTS idx_invitations_user ON public.invitations (user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_claimed ON public.invitations (claimed);

-- Migration statut texte → enum
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS status_v3 public.invitation_status;

UPDATE public.invitations
SET status_v3 = CASE
  WHEN status IN ('accepted', 'claimed') THEN 'claimed'::public.invitation_status
  WHEN status = 'sent' THEN 'distributed'::public.invitation_status
  WHEN status = 'opened' THEN 'opened'::public.invitation_status
  WHEN status = 'scanned' THEN 'scanned'::public.invitation_status
  WHEN status = 'cancelled' THEN 'cancelled'::public.invitation_status
  WHEN status = 'expired' THEN 'expired'::public.invitation_status
  ELSE 'created'::public.invitation_status
END
WHERE status_v3 IS NULL;

ALTER TABLE public.invitations DROP COLUMN IF EXISTS status;
ALTER TABLE public.invitations RENAME COLUMN status_v3 TO status;
ALTER TABLE public.invitations ALTER COLUMN status SET DEFAULT 'created';
ALTER TABLE public.invitations ALTER COLUMN status SET NOT NULL;

-- Journal distribution (horodatage, anti-doublon audit)
CREATE TABLE public.invitation_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES public.invitations (id) ON DELETE CASCADE,
  channel public.distribution_channel NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB,
  UNIQUE (invitation_id, channel, sent_at)
);

CREATE INDEX idx_invitation_distributions_invitation ON public.invitation_distributions (invitation_id);

-- Métriques INVITER
ALTER TABLE public.event_metrics
  ADD COLUMN IF NOT EXISTS invitations_created INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invitations_opened INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invitations_claimed INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invitations_used INTEGER NOT NULL DEFAULT 0;

-- Lecture publique par token (lien sans compte)
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  event_id UUID,
  guest_first_name TEXT,
  guest_last_name TEXT,
  guest_email TEXT,
  guest_phone TEXT,
  access_type_code TEXT,
  unique_code TEXT,
  token TEXT,
  status public.invitation_status,
  qr_payload TEXT,
  claimed BOOLEAN,
  opened_at TIMESTAMPTZ,
  event_title TEXT,
  event_starts_at TIMESTAMPTZ,
  event_location TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.id,
    i.event_id,
    i.guest_first_name,
    i.guest_last_name,
    i.guest_email,
    i.guest_phone,
    i.access_type_code,
    i.unique_code,
    i.token,
    i.status,
    i.qr_payload,
    i.claimed,
    i.opened_at,
    e.title,
    e.starts_at,
    e.location
  FROM public.invitations i
  JOIN public.events e ON e.id = i.event_id
  WHERE i.token = p_token
    AND i.status NOT IN ('cancelled', 'expired');
$$;

-- Ouverture lien (horodatage)
CREATE OR REPLACE FUNCTION public.mark_invitation_opened(p_token TEXT)
RETURNS public.invitation_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status public.invitation_status;
BEGIN
  UPDATE public.invitations
  SET
    opened_at = COALESCE(opened_at, NOW()),
    status = CASE
      WHEN status = 'distributed'::public.invitation_status THEN 'opened'::public.invitation_status
      ELSE status
    END
  WHERE token = p_token
  RETURNING status INTO v_status;
  RETURN v_status;
END;
$$;

-- Claim (compte INVORA ou réclamation explicite)
CREATE OR REPLACE FUNCTION public.claim_invitation(
  p_token TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.invitations%ROWTYPE;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'auth_required';
  END IF;

  SELECT * INTO v_inv FROM public.invitations WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'invitation_not_found';
  END IF;
  IF v_inv.status IN ('cancelled', 'expired', 'scanned') THEN
    RAISE EXCEPTION 'invitation_not_claimable';
  END IF;
  IF v_inv.claimed AND v_inv.user_id IS NOT NULL AND v_inv.user_id <> p_user_id THEN
    RAISE EXCEPTION 'already_claimed_other_user';
  END IF;

  UPDATE public.invitations
  SET
    claimed = TRUE,
    claimed_at = COALESCE(claimed_at, NOW()),
    claimed_by = p_user_id,
    user_id = p_user_id,
    status = 'claimed'::public.invitation_status
  WHERE id = v_inv.id;

  INSERT INTO public.wallet_passes (user_id, event_id, pass_type, reference_id, qr_payload)
  VALUES (
    p_user_id,
    v_inv.event_id,
    'invitation',
    v_inv.id,
    COALESCE(v_inv.qr_payload, v_inv.token)
  )
  ON CONFLICT (user_id, pass_type, reference_id) DO NOTHING;

  RETURN v_inv.id;
END;
$$;

-- Réconciliation automatique (téléphone / email)
CREATE OR REPLACE FUNCTION public.reconcile_user_invitations(p_user_id UUID DEFAULT auth.uid())
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_count INTEGER := 0;
  v_row public.invitations%ROWTYPE;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'auth_required';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  FOR v_row IN
    SELECT * FROM public.invitations
    WHERE user_id IS NULL
      AND status NOT IN ('cancelled', 'expired')
      AND (
        (v_profile.phone IS NOT NULL AND guest_phone = v_profile.phone)
        OR (v_profile.email IS NOT NULL AND guest_email = v_profile.email)
      )
  LOOP
    UPDATE public.invitations
    SET
      user_id = p_user_id,
      claimed = TRUE,
      claimed_at = COALESCE(claimed_at, NOW()),
      claimed_by = COALESCE(claimed_by, p_user_id),
      status = CASE
        WHEN status IN ('created', 'distributed', 'opened') THEN 'claimed'::public.invitation_status
        ELSE status
      END
    WHERE id = v_row.id;

    INSERT INTO public.wallet_passes (user_id, event_id, pass_type, reference_id, qr_payload)
    VALUES (
      p_user_id,
      v_row.event_id,
      'invitation',
      v_row.id,
      COALESCE(v_row.qr_payload, v_row.token)
    )
    ON CONFLICT (user_id, pass_type, reference_id) DO NOTHING;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- RLS access_types & distributions
ALTER TABLE public.access_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "access_types_organizer" ON public.access_types
  FOR ALL USING (public.is_event_organizer(event_id));

CREATE POLICY "invitation_distributions_organizer" ON public.invitation_distributions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.invitations i
      WHERE i.id = invitation_id AND public.is_event_organizer(i.event_id)
    )
  );

-- Invité : lecture wallet liée
CREATE POLICY "invitations_select_claimed_user" ON public.invitations
  FOR SELECT USING (user_id = auth.uid());

GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_invitation_opened(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_invitation(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_user_invitations(UUID) TO authenticated;
