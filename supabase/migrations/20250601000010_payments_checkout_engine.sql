-- PHASE 10 — PAYMENTS & CHECKOUT ENGINE (provider webhooks, attempts, refunds, reconciliation)

-- États paiement étendus
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'processing';
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'expired';
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'disputed';

CREATE TYPE public.checkout_universe AS ENUM (
  'inviter',
  'vendre',
  'organizer',
  'guest',
  'ticketing',
  'service'
);

CREATE TYPE public.refund_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled'
);

CREATE TYPE public.webhook_processing_status AS ENUM (
  'received',
  'processing',
  'processed',
  'failed',
  'ignored'
);

-- Fournisseurs (multi-provider)
CREATE TABLE IF NOT EXISTS public.payment_providers (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('card', 'mobile_money', 'wallet', 'aggregator')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  supports_refund BOOLEAN NOT NULL DEFAULT FALSE,
  phase INTEGER NOT NULL DEFAULT 1 CHECK (phase IN (1, 2)),
  config JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.payment_providers (id, display_name, provider_type, phase)
VALUES
  ('stripe', 'Stripe', 'card', 1),
  ('wave', 'Wave', 'mobile_money', 1),
  ('orange_money', 'Orange Money', 'mobile_money', 1),
  ('free_money', 'Free Money', 'mobile_money', 1),
  ('card', 'Carte bancaire', 'card', 1),
  ('paypal', 'PayPal', 'aggregator', 2),
  ('apple_pay', 'Apple Pay', 'wallet', 2),
  ('google_pay', 'Google Pay', 'wallet', 2)
ON CONFLICT (id) DO NOTHING;

-- Enrichir payments
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payment_attempt_id UUID,
  ADD COLUMN IF NOT EXISTS universe public.checkout_universe,
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'XOF',
  ADD COLUMN IF NOT EXISTS provider_event_id TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_ref
  ON public.payments (provider, provider_ref)
  WHERE provider_ref IS NOT NULL;

-- Tentatives de paiement
CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions (id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events (id) ON DELETE SET NULL,
  universe public.checkout_universe NOT NULL,
  provider_id TEXT NOT NULL REFERENCES public.payment_providers (id),
  amount_fcfa INTEGER NOT NULL CHECK (amount_fcfa > 0),
  currency TEXT NOT NULL DEFAULT 'XOF',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  provider_ref TEXT,
  idempotency_key TEXT NOT NULL,
  checkout_url TEXT,
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_tx ON public.payment_attempts (transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_attempts_status ON public.payment_attempts (payment_status, created_at DESC);

-- Webhooks (idempotence)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id TEXT NOT NULL REFERENCES public.payment_providers (id),
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payment_attempt_id UUID REFERENCES public.payment_attempts (id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  processing_status public.webhook_processing_status NOT NULL DEFAULT 'received',
  retry_count INTEGER NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
  last_error TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (provider_id, provider_event_id)
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_attempt ON public.webhook_events (payment_attempt_id);

-- Remboursements
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments (id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions (id) ON DELETE CASCADE,
  amount_fcfa INTEGER NOT NULL CHECK (amount_fcfa > 0),
  currency TEXT NOT NULL DEFAULT 'XOF',
  status public.refund_status NOT NULL DEFAULT 'pending',
  reason TEXT,
  provider_ref TEXT,
  is_partial BOOLEAN NOT NULL DEFAULT FALSE,
  requested_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refunds_payment ON public.refunds (payment_id);

-- Audit paiements (immuable, pas de DELETE)
CREATE TABLE IF NOT EXISTS public.payment_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES public.transactions (id) ON DELETE SET NULL,
  payment_attempt_id UUID REFERENCES public.payment_attempts (id) ON DELETE SET NULL,
  provider_id TEXT,
  provider_event_id TEXT,
  user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  amount_fcfa INTEGER,
  currency TEXT DEFAULT 'XOF',
  payment_status public.payment_status,
  reference_code TEXT,
  ip_address INET,
  device_fingerprint TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_audit_created ON public.payment_audit_log (created_at DESC);

-- Journal interne
CREATE OR REPLACE FUNCTION public.log_payment_audit(
  p_action TEXT,
  p_transaction_id UUID DEFAULT NULL,
  p_payment_attempt_id UUID DEFAULT NULL,
  p_provider_id TEXT DEFAULT NULL,
  p_provider_event_id TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_amount_fcfa INTEGER DEFAULT NULL,
  p_payment_status public.payment_status DEFAULT NULL,
  p_reference_code TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.payment_audit_log (
    transaction_id, payment_attempt_id, provider_id, provider_event_id,
    user_id, action, amount_fcfa, payment_status, reference_code, metadata
  ) VALUES (
    p_transaction_id, p_payment_attempt_id, p_provider_id, p_provider_event_id,
    p_user_id, p_action, p_amount_fcfa, p_payment_status, p_reference_code, p_metadata
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Checkout INVITER
CREATE OR REPLACE FUNCTION public.create_inviter_checkout(
  p_event_id UUID,
  p_quantity INTEGER,
  p_provider_id TEXT DEFAULT 'wave',
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing INTEGER;
  v_quote JSONB;
  v_total INTEGER;
  v_tx_id UUID;
  v_attempt_id UUID;
  v_idem TEXT;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_existing
  FROM public.invitations WHERE event_id = p_event_id;

  v_quote := public.calculate_inviter_pricing_quote(p_quantity, v_existing);
  v_total := (v_quote->>'totalFcfa')::INTEGER;
  IF v_total <= 0 THEN RAISE EXCEPTION 'invalid_quantity'; END IF;

  INSERT INTO public.transactions (
    event_id, amount_cents, currency, status, payment_status,
    gross_fcfa, universe, reference_code
  ) VALUES (
    p_event_id, v_total, 'XOF', 'pending', 'pending',
    v_total, 'inviter', encode(gen_random_bytes(8), 'hex')
  )
  RETURNING id INTO v_tx_id;

  v_idem := 'inviter:' || v_tx_id::TEXT || ':' || encode(gen_random_bytes(4), 'hex');

  INSERT INTO public.payment_attempts (
    transaction_id, event_id, universe, provider_id, amount_fcfa,
    idempotency_key, expires_at, user_id, metadata
  ) VALUES (
    v_tx_id, p_event_id, 'inviter', p_provider_id, v_total,
    v_idem, NOW() + INTERVAL '30 minutes', p_user_id,
    jsonb_build_object('quote', v_quote, 'quantity', p_quantity)
  )
  RETURNING id INTO v_attempt_id;

  PERFORM public.log_payment_audit(
    'checkout_initiated', v_tx_id, v_attempt_id, p_provider_id,
    NULL, p_user_id, v_total, 'pending'::public.payment_status
  );

  RETURN jsonb_build_object(
    'transactionId', v_tx_id,
    'paymentAttemptId', v_attempt_id,
    'amountFcfa', v_total,
    'currency', 'XOF',
    'quote', v_quote,
    'checkoutUrl', format('/checkout/%s', v_attempt_id),
    'expiresAt', (NOW() + INTERVAL '30 minutes')
  );
END;
$$;

-- Initier checkout VENDRE (transaction + attempt, pas de fulfillment)
CREATE OR REPLACE FUNCTION public.initiate_vendre_checkout(
  p_event_id UUID,
  p_ticket_type_id UUID,
  p_quantity INTEGER,
  p_buyer_name TEXT,
  p_buyer_phone TEXT,
  p_buyer_email TEXT DEFAULT NULL,
  p_provider_id TEXT DEFAULT 'wave'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx_id UUID;
  v_tx public.transactions%ROWTYPE;
  v_attempt_id UUID;
  v_idem TEXT;
  v_total INTEGER;
BEGIN
  v_tx_id := public.create_ticket_checkout(
    p_event_id, p_ticket_type_id, p_quantity,
    p_buyer_name, p_buyer_phone, p_buyer_email
  );

  SELECT * INTO v_tx FROM public.transactions WHERE id = v_tx_id;
  v_total := v_tx.amount_cents;

  v_idem := 'vendre:' || v_tx_id::TEXT || ':' || encode(gen_random_bytes(4), 'hex');

  INSERT INTO public.payment_attempts (
    transaction_id, event_id, universe, provider_id, amount_fcfa,
    idempotency_key, expires_at, metadata
  ) VALUES (
    v_tx_id, p_event_id, 'vendre', p_provider_id, v_total,
    v_idem, NOW() + INTERVAL '30 minutes',
    jsonb_build_object('buyer_name', p_buyer_name, 'buyer_phone', p_buyer_phone)
  )
  RETURNING id INTO v_attempt_id;

  PERFORM public.log_payment_audit(
    'checkout_initiated', v_tx_id, v_attempt_id, p_provider_id,
    NULL, NULL, v_total, 'pending'::public.payment_status
  );

  RETURN jsonb_build_object(
    'transactionId', v_tx_id,
    'paymentAttemptId', v_attempt_id,
    'amountFcfa', v_total,
    'currency', 'XOF',
    'checkoutUrl', format('/checkout/%s', v_attempt_id)
  );
END;
$$;

-- Confirmation provider (idempotent)
CREATE OR REPLACE FUNCTION public.confirm_payment_attempt(
  p_payment_attempt_id UUID,
  p_provider_ref TEXT,
  p_provider_event_id TEXT,
  p_amount_fcfa INTEGER,
  p_provider_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt public.payment_attempts%ROWTYPE;
  v_payment_id UUID;
  v_settlement_id UUID;
BEGIN
  SELECT * INTO v_attempt FROM public.payment_attempts
  WHERE id = p_payment_attempt_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'payment_attempt_not_found'; END IF;

  IF v_attempt.payment_status = 'paid' THEN
    RETURN jsonb_build_object(
      'status', 'paid',
      'paymentAttemptId', v_attempt.id,
      'idempotent', TRUE
    );
  END IF;

  IF v_attempt.expires_at IS NOT NULL AND v_attempt.expires_at < NOW() THEN
    UPDATE public.payment_attempts SET payment_status = 'expired', updated_at = NOW()
    WHERE id = p_payment_attempt_id;
    RAISE EXCEPTION 'payment_expired';
  END IF;

  IF p_amount_fcfa <> v_attempt.amount_fcfa THEN
    PERFORM public.log_payment_audit(
      'amount_mismatch', v_attempt.transaction_id, v_attempt.id,
      COALESCE(p_provider_id, v_attempt.provider_id), p_provider_event_id,
      v_attempt.user_id, p_amount_fcfa, 'failed'::public.payment_status,
      NULL, jsonb_build_object('expected', v_attempt.amount_fcfa, 'received', p_amount_fcfa)
    );
    RAISE EXCEPTION 'amount_mismatch';
  END IF;

  UPDATE public.payment_attempts
  SET payment_status = 'paid',
      provider_ref = p_provider_ref,
      paid_at = NOW(),
      updated_at = NOW()
  WHERE id = p_payment_attempt_id;

  UPDATE public.transactions
  SET payment_status = 'paid', status = 'completed', provider = COALESCE(p_provider_id, v_attempt.provider_id),
      provider_ref = p_provider_ref, gross_fcfa = v_attempt.amount_fcfa,
      universe = CASE
        WHEN v_attempt.universe IN ('inviter', 'vendre') THEN v_attempt.universe::TEXT::public.finance_universe
        ELSE 'vendre'::public.finance_universe
      END
  WHERE id = v_attempt.transaction_id;

  INSERT INTO public.payments (
    transaction_id, payment_attempt_id, provider, provider_ref,
    amount_fcfa, payment_status, paid_at, universe, provider_event_id
  ) VALUES (
    v_attempt.transaction_id, v_attempt.id, COALESCE(p_provider_id, v_attempt.provider_id),
    p_provider_ref, v_attempt.amount_fcfa, 'paid', NOW(), v_attempt.universe, p_provider_event_id
  )
  RETURNING id INTO v_payment_id;

  IF v_attempt.universe = 'vendre' THEN
    PERFORM public.complete_ticket_payment(v_attempt.transaction_id);
  END IF;

  v_settlement_id := public.freeze_finance_settlement(v_attempt.transaction_id);

  PERFORM public.log_payment_audit(
    'payment_confirmed', v_attempt.transaction_id, v_attempt.id,
    COALESCE(p_provider_id, v_attempt.provider_id), p_provider_event_id,
    v_attempt.user_id, v_attempt.amount_fcfa, 'paid'::public.payment_status
  );

  RETURN jsonb_build_object(
    'status', 'paid',
    'paymentId', v_payment_id,
    'paymentAttemptId', v_attempt.id,
    'transactionId', v_attempt.transaction_id,
    'settlementId', v_settlement_id,
    'universe', v_attempt.universe
  );
END;
$$;

-- Webhook : enregistrement + traitement idempotent
CREATE OR REPLACE FUNCTION public.process_payment_webhook(
  p_provider_id TEXT,
  p_provider_event_id TEXT,
  p_event_type TEXT,
  p_payment_attempt_id UUID,
  p_amount_fcfa INTEGER,
  p_provider_ref TEXT,
  p_payload JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_webhook_id UUID;
  v_result JSONB;
BEGIN
  INSERT INTO public.webhook_events (
    provider_id, provider_event_id, event_type, payment_attempt_id, payload, processing_status
  ) VALUES (
    p_provider_id, p_provider_event_id, p_event_type, p_payment_attempt_id, p_payload, 'processing'
  )
  ON CONFLICT (provider_id, provider_event_id) DO UPDATE
  SET retry_count = webhook_events.retry_count + 1,
      processing_status = 'processing'
  RETURNING id INTO v_webhook_id;

  IF p_event_type IN ('payment.succeeded', 'charge.succeeded', 'checkout.completed') THEN
    v_result := public.confirm_payment_attempt(
      p_payment_attempt_id, p_provider_ref, p_provider_event_id, p_amount_fcfa, p_provider_id
    );
  ELSIF p_event_type IN ('payment.failed', 'charge.failed') THEN
    UPDATE public.payment_attempts
    SET payment_status = 'failed', failed_at = NOW(), updated_at = NOW()
    WHERE id = p_payment_attempt_id;
    UPDATE public.transactions SET payment_status = 'failed' WHERE id = (
      SELECT transaction_id FROM public.payment_attempts WHERE id = p_payment_attempt_id
    );
    v_result := jsonb_build_object('status', 'failed');
  ELSE
    UPDATE public.webhook_events SET processing_status = 'ignored', processed_at = NOW() WHERE id = v_webhook_id;
    RETURN jsonb_build_object('status', 'ignored');
  END IF;

  UPDATE public.webhook_events
  SET processing_status = 'processed', processed_at = NOW()
  WHERE id = v_webhook_id;

  RETURN v_result;
END;
$$;

-- Réconciliation
CREATE OR REPLACE FUNCTION public.reconcile_payment_attempt(p_payment_attempt_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt public.payment_attempts%ROWTYPE;
  v_payment public.payments%ROWTYPE;
  v_delta INTEGER;
BEGIN
  SELECT * INTO v_attempt FROM public.payment_attempts WHERE id = p_payment_attempt_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment_attempt_not_found'; END IF;

  SELECT * INTO v_payment FROM public.payments WHERE payment_attempt_id = p_payment_attempt_id LIMIT 1;

  v_delta := COALESCE(v_payment.amount_fcfa, 0) - v_attempt.amount_fcfa;

  RETURN jsonb_build_object(
    'paymentAttemptId', v_attempt.id,
    'expectedFcfa', v_attempt.amount_fcfa,
    'receivedFcfa', COALESCE(v_payment.amount_fcfa, 0),
    'deltaFcfa', v_delta,
    'attemptStatus', v_attempt.payment_status,
    'paymentStatus', COALESCE(v_payment.payment_status::TEXT, 'none'),
    'provider', v_attempt.provider_id,
    'providerRef', v_attempt.provider_ref,
    'reconciled', v_delta = 0 AND v_attempt.payment_status = 'paid' AND v_payment.id IS NOT NULL
  );
END;
$$;

-- Remboursement
CREATE OR REPLACE FUNCTION public.create_payment_refund(
  p_payment_id UUID,
  p_amount_fcfa INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_is_partial BOOLEAN DEFAULT FALSE,
  p_requested_by UUID DEFAULT auth.uid()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_refund_id UUID;
BEGIN
  SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment_not_found'; END IF;
  IF v_payment.payment_status <> 'paid' THEN RAISE EXCEPTION 'payment_not_refundable'; END IF;
  IF p_amount_fcfa > v_payment.amount_fcfa THEN RAISE EXCEPTION 'refund_exceeds_payment'; END IF;

  INSERT INTO public.refunds (
    payment_id, transaction_id, amount_fcfa, reason, is_partial, requested_by, status
  ) VALUES (
    p_payment_id, v_payment.transaction_id, p_amount_fcfa, p_reason, p_is_partial, p_requested_by, 'pending'
  )
  RETURNING id INTO v_refund_id;

  UPDATE public.payments SET payment_status = CASE WHEN p_is_partial THEN payment_status ELSE 'refunded' END
  WHERE id = p_payment_id;

  UPDATE public.transactions SET payment_status = 'refunded' WHERE id = v_payment.transaction_id AND NOT p_is_partial;

  PERFORM public.log_payment_audit(
    'refund_requested', v_payment.transaction_id, v_payment.payment_attempt_id,
    v_payment.provider, NULL, p_requested_by, p_amount_fcfa, 'refunded'::public.payment_status,
    NULL, jsonb_build_object('refund_id', v_refund_id, 'reason', p_reason)
  );

  RETURN v_refund_id;
END;
$$;

-- Gate : complete_ticket_payment exige tentative payée
CREATE OR REPLACE FUNCTION public.complete_ticket_payment(p_transaction_id UUID)
RETURNS SETOF public.tickets
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt public.payment_attempts%ROWTYPE;
BEGIN
  SELECT * INTO v_attempt FROM public.payment_attempts
  WHERE transaction_id = p_transaction_id AND universe = 'vendre' AND payment_status = 'paid'
  ORDER BY paid_at DESC NULLS LAST LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'payment_not_confirmed';
  END IF;

  RETURN QUERY SELECT * FROM public._complete_ticket_payment_internal(p_transaction_id);
END;
$$;

CREATE OR REPLACE FUNCTION public._complete_ticket_payment_internal(p_transaction_id UUID)
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

  IF EXISTS (SELECT 1 FROM public.tickets WHERE transaction_id = p_transaction_id LIMIT 1) THEN
    RETURN QUERY SELECT * FROM public.tickets WHERE transaction_id = p_transaction_id;
    RETURN;
  END IF;

  SELECT * INTO v_type FROM public.ticket_types WHERE id = v_tx.ticket_type_id;

  UPDATE public.transactions SET frozen_at = NOW() WHERE id = p_transaction_id AND frozen_at IS NULL;

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
      v_ticket_id, v_tx.event_id, v_tx.ticket_type_id, v_token, 'valid',
      v_code, v_token, v_tx.buyer_phone, v_tx.buyer_email,
      split_part(v_tx.buyer_name, ' ', 1), p_transaction_id, 'paid', NOW()
    )
    RETURNING *;
  END LOOP;

  UPDATE public.ticket_types SET sold_count = sold_count + v_tx.quantity WHERE id = v_tx.ticket_type_id;
END;
$$;

-- Liste providers actifs
CREATE OR REPLACE FUNCTION public.list_payment_providers(p_phase INTEGER DEFAULT 1)
RETURNS SETOF public.payment_providers
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.payment_providers
  WHERE is_active AND phase <= COALESCE(p_phase, 1)
  ORDER BY display_name;
$$;

ALTER TABLE public.payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_providers_read" ON public.payment_providers FOR SELECT USING (TRUE);

CREATE POLICY "payment_attempts_own_or_event" ON public.payment_attempts
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.has_event_role(event_id, ARRAY['owner', 'organizer'])
  );

CREATE POLICY "payments_read_via_tx" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.transactions t
      JOIN public.events e ON e.id = t.event_id
      WHERE t.id = payments.transaction_id
        AND (e.organizer_id = auth.uid() OR public.has_event_role(e.id, ARRAY['owner', 'organizer']))
    )
  );

CREATE POLICY "refunds_read_own" ON public.refunds
  FOR SELECT USING (
    requested_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.transactions t
      JOIN public.events e ON e.id = t.event_id
      WHERE t.id = refunds.transaction_id AND e.organizer_id = auth.uid()
    )
  );

CREATE POLICY "payment_audit_no_delete" ON public.payment_audit_log FOR DELETE USING (FALSE);
CREATE POLICY "payment_audit_organizer_read" ON public.payment_audit_log
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.transactions t
      JOIN public.events e ON e.id = t.event_id
      WHERE t.id = payment_audit_log.transaction_id AND e.organizer_id = auth.uid()
    )
  );

GRANT EXECUTE ON FUNCTION public.log_payment_audit(TEXT, UUID, UUID, TEXT, TEXT, UUID, INTEGER, public.payment_status, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_inviter_checkout(UUID, INTEGER, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.initiate_vendre_checkout(UUID, UUID, INTEGER, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
-- Webhooks : service role uniquement (Edge Functions)
REVOKE ALL ON FUNCTION public.process_payment_webhook(TEXT, TEXT, TEXT, UUID, INTEGER, TEXT, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_payment_attempt(UUID, TEXT, TEXT, INTEGER, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.reconcile_payment_attempt(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_payment_refund(UUID, INTEGER, TEXT, BOOLEAN, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_payment_providers(INTEGER) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.complete_ticket_payment(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_ticket_payment(UUID) TO authenticated;
