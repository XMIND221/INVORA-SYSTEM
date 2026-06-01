-- PHASE 7 — WALLET & ACCESS ENGINE (modèle unifié, claim, réconciliation, audit)

CREATE TYPE public.invora_access_universe AS ENUM ('inviter', 'vendre');

CREATE TYPE public.invora_access_status AS ENUM (
  'created',
  'distributed',
  'opened',
  'claimed',
  'scanned',
  'used',
  'expired',
  'cancelled'
);

CREATE TYPE public.wallet_notification_kind AS ENUM (
  'access_received',
  'access_claimed',
  'access_used',
  'access_expired',
  'event_reminder'
);

-- Vue unifiée INVITER + VENDRE
CREATE OR REPLACE VIEW public.wallet_access_unified AS
SELECT
  i.id AS access_id,
  i.event_id,
  trim(COALESCE(i.guest_first_name, '') || ' ' || COALESCE(i.guest_last_name, '')) AS holder_name,
  i.guest_phone AS phone,
  i.guest_email AS email,
  i.access_type_code AS access_type,
  i.qr_payload AS qr_code,
  i.unique_code AS access_code,
  CASE
    WHEN i.status = 'scanned' THEN 'used'::public.invora_access_status
    ELSE i.status::text::public.invora_access_status
  END AS status,
  i.claimed,
  i.claimed_at,
  i.claimed_by,
  i.user_id,
  i.created_at,
  'inviter'::public.invora_access_universe AS universe,
  'invitation'::TEXT AS pass_kind,
  i.token AS public_token
FROM public.invitations i
UNION ALL
SELECT
  t.id,
  t.event_id,
  trim(COALESCE(t.buyer_first_name, '') || ' ' || COALESCE(t.buyer_last_name, '')),
  t.buyer_phone,
  t.buyer_email,
  tt.name,
  t.access_token,
  t.unique_code,
  CASE
    WHEN t.scanned_at IS NOT NULL THEN 'used'::public.invora_access_status
    WHEN t.payment_status <> 'paid' THEN 'created'::public.invora_access_status
    WHEN t.claimed THEN 'claimed'::public.invora_access_status
    ELSE 'distributed'::public.invora_access_status
  END,
  t.claimed,
  t.claimed_at,
  t.claimed_by,
  t.user_id,
  t.created_at,
  'vendre'::public.invora_access_universe,
  'ticket'::TEXT,
  t.access_token
FROM public.tickets t
JOIN public.ticket_types tt ON tt.id = t.ticket_type_id;

-- Audit accès (immuable)
CREATE TABLE public.access_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_id UUID,
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_access_audit_access ON public.access_audit_log (access_id, created_at DESC);

-- Journal réconciliation wallet
CREATE TABLE public.wallet_reconciliation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  phone TEXT,
  email TEXT,
  invitations_linked INTEGER NOT NULL DEFAULT 0,
  tickets_linked INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications (préparé)
CREATE TABLE public.wallet_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles (id) ON DELETE CASCADE,
  access_id UUID,
  kind public.wallet_notification_kind NOT NULL,
  payload JSONB,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

-- Wallet Pass exports Apple / Google (préparé)
CREATE TABLE public.wallet_pass_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_id UUID NOT NULL,
  user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('apple', 'google', 'download')),
  artifact_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Claim unifié (délègue INVITER / VENDRE)
CREATE OR REPLACE FUNCTION public.claim_access(
  p_public_token TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.invitations%ROWTYPE;
  v_ticket public.tickets%ROWTYPE;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_inv FROM public.invitations WHERE token = p_public_token;
  IF FOUND THEN
    PERFORM public.claim_invitation(p_public_token, p_user_id);
    INSERT INTO public.access_audit_log (access_id, event_id, user_id, action)
    VALUES (v_inv.id, v_inv.event_id, p_user_id, 'claimed');
    RETURN jsonb_build_object('universe', 'inviter', 'accessId', v_inv.id);
  END IF;

  SELECT * INTO v_ticket FROM public.tickets WHERE access_token = p_public_token;
  IF FOUND THEN
    PERFORM public.claim_ticket(p_public_token, p_user_id);
    INSERT INTO public.access_audit_log (access_id, event_id, user_id, action)
    VALUES (v_ticket.id, v_ticket.event_id, p_user_id, 'claimed');
    RETURN jsonb_build_object('universe', 'vendre', 'accessId', v_ticket.id);
  END IF;

  RAISE EXCEPTION 'access_not_found';
END;
$$;

-- Réconciliation automatique complète
CREATE OR REPLACE FUNCTION public.reconcile_user_wallet(
  p_user_id UUID DEFAULT auth.uid(),
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv INTEGER;
  v_tix INTEGER;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  v_inv := public.reconcile_user_invitations(p_user_id);
  v_tix := public.reconcile_user_tickets(p_user_id);

  INSERT INTO public.wallet_reconciliation_runs (user_id, phone, email, invitations_linked, tickets_linked)
  VALUES (p_user_id, p_phone, p_email, v_inv, v_tix);

  RETURN jsonb_build_object(
    'userId', p_user_id,
    'invitationsLinked', v_inv,
    'ticketsLinked', v_tix
  );
END;
$$;

-- Liste wallet utilisateur
CREATE OR REPLACE FUNCTION public.list_user_wallet_accesses(p_user_id UUID DEFAULT auth.uid())
RETURNS SETOF public.wallet_access_unified
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.*
  FROM public.wallet_access_unified w
  WHERE w.user_id = p_user_id
     OR (w.claimed AND w.claimed_by = p_user_id)
  ORDER BY w.created_at DESC;
$$;

-- Recherche wallet
CREATE OR REPLACE FUNCTION public.search_user_wallet_accesses(
  p_user_id UUID,
  p_query TEXT
)
RETURNS SETOF public.wallet_access_unified
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.*
  FROM public.wallet_access_unified w
  WHERE (w.user_id = p_user_id OR w.claimed_by = p_user_id)
    AND (
      w.holder_name ILIKE '%' || trim(p_query) || '%'
      OR w.phone ILIKE '%' || trim(p_query) || '%'
      OR w.email ILIKE '%' || trim(p_query) || '%'
      OR w.access_code ILIKE '%' || trim(p_query) || '%'
    )
  LIMIT 50;
$$;

-- Analytics wallet
CREATE OR REPLACE FUNCTION public.get_wallet_access_analytics(p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'active', COUNT(*) FILTER (WHERE status IN ('distributed', 'opened', 'claimed')),
    'used', COUNT(*) FILTER (WHERE status IN ('scanned', 'used')),
    'expired', COUNT(*) FILTER (WHERE status = 'expired'),
    'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled'),
    'utilizationRate', CASE
      WHEN COUNT(*) > 0 THEN ROUND(
        100.0 * COUNT(*) FILTER (WHERE status IN ('scanned', 'used')) / COUNT(*), 1
      )
      ELSE 0
    END
  )
  FROM public.wallet_access_unified w
  WHERE w.user_id = p_user_id OR w.claimed_by = p_user_id;
$$;

ALTER TABLE public.access_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_reconciliation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_pass_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "access_audit_select_own" ON public.access_audit_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "access_audit_no_delete" ON public.access_audit_log
  FOR DELETE USING (FALSE);

CREATE POLICY "wallet_reconcile_own" ON public.wallet_reconciliation_runs
  FOR SELECT USING (user_id = auth.uid());

GRANT EXECUTE ON FUNCTION public.claim_access(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_user_wallet(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_user_wallet_accesses(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_user_wallet_accesses(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_wallet_access_analytics(UUID) TO authenticated;
