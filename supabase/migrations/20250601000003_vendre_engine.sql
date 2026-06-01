-- PHASE 4 — VENDRE ENGINE (billetterie publique, finance côté serveur uniquement)

CREATE TYPE public.ticketing_status AS ENUM (
  'draft',
  'published',
  'on_sale',
  'sold_out',
  'ended',
  'archived'
);

CREATE TYPE public.payment_status AS ENUM (
  'pending',
  'paid',
  'failed',
  'refunded'
);

-- Commission INVORA (FCFA) — source de vérité unique
CREATE OR REPLACE FUNCTION public.calculate_invora_commission(p_price_fcfa INTEGER)
RETURNS TABLE (
  price_fcfa INTEGER,
  commission_fcfa INTEGER,
  organizer_net_fcfa INTEGER,
  currency TEXT
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_commission INTEGER;
BEGIN
  IF p_price_fcfa IS NULL OR p_price_fcfa < 0 THEN
    RAISE EXCEPTION 'invalid_price';
  END IF;

  v_commission := CASE
    WHEN p_price_fcfa >= 500000 THEN 5000
    WHEN p_price_fcfa >= 100000 THEN 2500
    WHEN p_price_fcfa >= 50000 THEN 1500
    WHEN p_price_fcfa >= 20000 THEN 1000
    WHEN p_price_fcfa >= 10000 THEN 750
    WHEN p_price_fcfa >= 5000 THEN 500
    ELSE 0
  END;

  RETURN QUERY
  SELECT
    p_price_fcfa,
    v_commission,
    GREATEST(p_price_fcfa - v_commission, 0),
    'XOF'::TEXT;
END;
$$;

ALTER TABLE public.ticket_types
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS commission_fcfa INTEGER,
  ADD COLUMN IF NOT EXISTS organizer_net_fcfa INTEGER,
  ADD COLUMN IF NOT EXISTS ticketing_status public.ticketing_status NOT NULL DEFAULT 'draft';

UPDATE public.ticket_types SET code = lower(regexp_replace(name, '\s+', '_', 'g')) WHERE code IS NULL;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS ticketing_status public.ticketing_status DEFAULT 'draft';

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS payment_status public.payment_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ticket_type_id UUID REFERENCES public.ticket_types (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  ADD COLUMN IF NOT EXISTS commission_fcfa INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS organizer_net_fcfa INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS buyer_email TEXT,
  ADD COLUMN IF NOT EXISTS buyer_phone TEXT,
  ADD COLUMN IF NOT EXISTS buyer_name TEXT,
  ADD COLUMN IF NOT EXISTS frozen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ticket_token TEXT UNIQUE;

-- Billets émis
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS unique_code TEXT,
  ADD COLUMN IF NOT EXISTS access_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS buyer_first_name TEXT,
  ADD COLUMN IF NOT EXISTS buyer_last_name TEXT,
  ADD COLUMN IF NOT EXISTS buyer_phone TEXT,
  ADD COLUMN IF NOT EXISTS buyer_email TEXT,
  ADD COLUMN IF NOT EXISTS transaction_id UUID REFERENCES public.transactions (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_status public.payment_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS claimed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS scanned_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_unique_code ON public.tickets (unique_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_access_token ON public.tickets (access_token);

-- Analytics billetterie
ALTER TABLE public.event_metrics
  ADD COLUMN IF NOT EXISTS page_views INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cart_adds INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purchases_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS conversion_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS organizer_revenue_fcfa INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invora_commission_fcfa INTEGER NOT NULL DEFAULT 0;

-- Sync commission sur ticket_types à la création / mise à jour prix
CREATE OR REPLACE FUNCTION public.sync_ticket_type_pricing()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  SELECT c.commission_fcfa, c.organizer_net_fcfa
  INTO NEW.commission_fcfa, NEW.organizer_net_fcfa
  FROM public.calculate_invora_commission(NEW.price_cents) AS c;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ticket_types_pricing_sync ON public.ticket_types;
CREATE TRIGGER ticket_types_pricing_sync
  BEFORE INSERT OR UPDATE OF price_cents ON public.ticket_types
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_ticket_type_pricing();

-- Achat billet (transaction figée après paiement)
CREATE OR REPLACE FUNCTION public.create_ticket_checkout(
  p_event_id UUID,
  p_ticket_type_id UUID,
  p_quantity INTEGER,
  p_buyer_name TEXT,
  p_buyer_phone TEXT,
  p_buyer_email TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_type public.ticket_types%ROWTYPE;
  v_pricing RECORD;
  v_tx_id UUID;
  v_unit INTEGER;
  v_total INTEGER;
BEGIN
  SELECT * INTO v_type FROM public.ticket_types WHERE id = p_ticket_type_id AND event_id = p_event_id;
  IF NOT FOUND OR NOT v_type.is_active THEN
    RAISE EXCEPTION 'ticket_type_unavailable';
  END IF;

  IF v_type.quantity IS NOT NULL AND (v_type.sold_count + p_quantity) > v_type.quantity THEN
    RAISE EXCEPTION 'insufficient_stock';
  END IF;

  SELECT * INTO v_pricing FROM public.calculate_invora_commission(v_type.price_cents);
  v_unit := v_pricing.price_fcfa;
  v_total := v_unit * p_quantity;

  INSERT INTO public.transactions (
    event_id, amount_cents, currency, status, payment_status,
    ticket_type_id, quantity, commission_fcfa, organizer_net_fcfa,
    buyer_name, buyer_phone, buyer_email, ticket_token
  )
  VALUES (
    p_event_id,
    v_total,
    'XOF',
    'pending',
    'pending',
    p_ticket_type_id,
    p_quantity,
    v_pricing.commission_fcfa * p_quantity,
    v_pricing.organizer_net_fcfa * p_quantity,
    p_buyer_name,
    p_buyer_phone,
    p_buyer_email,
    encode(gen_random_bytes(12), 'hex')
  )
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_ticket_payment(p_transaction_id UUID)
RETURNS SETOF public.tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx public.transactions%ROWTYPE;
  v_type public.ticket_types%ROWTYPE;
  v_i INTEGER;
  v_ticket_id UUID;
  v_token TEXT;
  v_code TEXT;
BEGIN
  SELECT * INTO v_tx FROM public.transactions WHERE id = p_transaction_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'transaction_not_found'; END IF;
  IF v_tx.payment_status = 'paid' THEN RAISE EXCEPTION 'already_paid'; END IF;
  IF v_tx.frozen_at IS NOT NULL THEN RAISE EXCEPTION 'transaction_frozen'; END IF;

  SELECT * INTO v_type FROM public.ticket_types WHERE id = v_tx.ticket_type_id;

  UPDATE public.transactions
  SET payment_status = 'paid', status = 'completed', frozen_at = NOW()
  WHERE id = p_transaction_id;

  FOR v_i IN 1..v_tx.quantity LOOP
    v_ticket_id := gen_random_uuid();
    v_token := encode(gen_random_bytes(16), 'hex');
    v_code := 'TKT-' || upper(substr(replace(v_ticket_id::text, '-', ''), 1, 8));

    RETURN QUERY
    INSERT INTO public.tickets (
      id, event_id, ticket_type_id, qr_payload, status,
      unique_code, access_token, buyer_phone, buyer_email,
      buyer_first_name, transaction_id, payment_status, purchased_at
    )
    VALUES (
      v_ticket_id,
      v_tx.event_id,
      v_tx.ticket_type_id,
      v_token,
      'valid',
      v_code,
      v_token,
      v_tx.buyer_phone,
      v_tx.buyer_email,
      split_part(v_tx.buyer_name, ' ', 1),
      p_transaction_id,
      'paid',
      NOW()
    )
    RETURNING *;
  END LOOP;

  UPDATE public.ticket_types
  SET sold_count = sold_count + v_tx.quantity
  WHERE id = v_tx.ticket_type_id;

  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_ticket(p_access_token TEXT, p_user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket public.tickets%ROWTYPE;
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;

  SELECT * INTO v_ticket FROM public.tickets WHERE access_token = p_access_token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ticket_not_found'; END IF;
  IF v_ticket.payment_status <> 'paid' THEN RAISE EXCEPTION 'payment_required'; END IF;

  UPDATE public.tickets
  SET claimed = TRUE, claimed_at = COALESCE(claimed_at, NOW()),
      claimed_by = p_user_id, user_id = p_user_id
  WHERE id = v_ticket.id;

  INSERT INTO public.wallet_passes (user_id, event_id, pass_type, reference_id, qr_payload)
  VALUES (p_user_id, v_ticket.event_id, 'ticket', v_ticket.id, v_ticket.qr_payload)
  ON CONFLICT (user_id, pass_type, reference_id) DO NOTHING;

  RETURN v_ticket.id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reconcile_user_tickets(p_user_id UUID DEFAULT auth.uid())
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_count INTEGER := 0;
  v_row public.tickets%ROWTYPE;
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;

  FOR v_row IN
    SELECT * FROM public.tickets
    WHERE user_id IS NULL AND payment_status = 'paid'
      AND (
        (v_profile.phone IS NOT NULL AND buyer_phone = v_profile.phone)
        OR (v_profile.email IS NOT NULL AND buyer_email = v_profile.email)
      )
  LOOP
    PERFORM public.claim_ticket(v_row.access_token, p_user_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_ticketing(p_event_slug TEXT)
RETURNS TABLE (
  event_id UUID,
  title TEXT,
  description TEXT,
  location TEXT,
  starts_at TIMESTAMPTZ,
  cover_url TEXT,
  ticketing_status public.ticketing_status
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.title, e.description, e.location, e.starts_at, e.cover_url, e.ticketing_status
  FROM public.events e
  WHERE e.slug = p_event_slug AND e.universe = 'vendre' AND e.visibility = 'public';
$$;

GRANT EXECUTE ON FUNCTION public.calculate_invora_commission(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_ticket_checkout(UUID, UUID, INTEGER, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_ticket_payment(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_ticket(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_user_tickets(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_ticketing(TEXT) TO anon, authenticated;
