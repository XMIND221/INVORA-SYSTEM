-- PHASE 9 — BUSINESS & FINANCE ENGINE (source de vérité financière)

CREATE TYPE public.finance_universe AS ENUM ('inviter', 'vendre');

CREATE TYPE public.payout_entity_type AS ENUM ('organizer', 'partner');

CREATE TYPE public.payout_request_status AS ENUM (
  'pending',
  'approved',
  'paid',
  'rejected'
);

-- Paiements (lien provider)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions (id) ON DELETE CASCADE,
  provider TEXT,
  provider_ref TEXT,
  amount_fcfa INTEGER NOT NULL CHECK (amount_fcfa >= 0),
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_transaction ON public.payments (transaction_id);

-- Répartitions figées par transaction
CREATE TABLE IF NOT EXISTS public.finance_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL UNIQUE REFERENCES public.transactions (id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  universe public.finance_universe NOT NULL,
  gross_fcfa INTEGER NOT NULL CHECK (gross_fcfa >= 0),
  invora_commission_fcfa INTEGER NOT NULL CHECK (invora_commission_fcfa >= 0),
  partner_commission_fcfa INTEGER NOT NULL DEFAULT 0 CHECK (partner_commission_fcfa >= 0),
  organizer_net_fcfa INTEGER NOT NULL CHECK (organizer_net_fcfa >= 0),
  reference_code TEXT,
  payment_status public.payment_status NOT NULL,
  frozen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_settlements_event ON public.finance_settlements (event_id, created_at DESC);

-- Soldes organisateur
CREATE TABLE IF NOT EXISTS public.organizer_balances (
  organizer_id UUID PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  available_fcfa INTEGER NOT NULL DEFAULT 0 CHECK (available_fcfa >= 0),
  pending_fcfa INTEGER NOT NULL DEFAULT 0 CHECK (pending_fcfa >= 0),
  withdrawn_fcfa INTEGER NOT NULL DEFAULT 0 CHECK (withdrawn_fcfa >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Demandes de retrait organisateur
CREATE TABLE IF NOT EXISTS public.organizer_payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  amount_fcfa INTEGER NOT NULL CHECK (amount_fcfa > 0),
  status public.payout_request_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_organizer_payouts ON public.organizer_payout_requests (organizer_id);

-- Audit financier immuable
CREATE TABLE IF NOT EXISTS public.finance_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  amount_fcfa INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finance_audit_created ON public.finance_audit_log (created_at DESC);

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS gross_fcfa INTEGER,
  ADD COLUMN IF NOT EXISTS partner_commission_fcfa INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS universe public.finance_universe,
  ADD COLUMN IF NOT EXISTS reference_code TEXT;

-- INVITER : prix unitaire par rang d'accès (1-based)
CREATE OR REPLACE FUNCTION public.calculate_inviter_unit_price(p_access_index INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_access_index IS NULL OR p_access_index < 1 THEN 950
    WHEN p_access_index >= 501 THEN 300
    WHEN p_access_index >= 301 THEN 550
    WHEN p_access_index >= 151 THEN 650
    WHEN p_access_index >= 100 THEN 750
    WHEN p_access_index >= 31 THEN 850
    WHEN p_access_index >= 16 THEN 900
    ELSE 950
  END;
$$;

-- Devis INVITER (quantité + stock existant)
CREATE OR REPLACE FUNCTION public.calculate_inviter_pricing_quote(
  p_quantity INTEGER,
  p_existing_count INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_qty INTEGER := GREATEST(COALESCE(p_quantity, 0), 0);
  v_existing INTEGER := GREATEST(COALESCE(p_existing_count, 0), 0);
  v_i INTEGER;
  v_total INTEGER := 0;
  v_unit INTEGER;
  v_current_unit INTEGER;
  v_next_threshold INTEGER;
  v_next_price INTEGER;
  v_until INTEGER;
BEGIN
  IF v_qty = 0 THEN
    v_current_unit := public.calculate_inviter_unit_price(v_existing + 1);
    RETURN jsonb_build_object(
      'quantity', 0,
      'existingCount', v_existing,
      'totalFcfa', 0,
      'unitPriceFcfa', v_current_unit,
      'tierLabel', public.inviter_tier_label(v_existing + 1),
      'nextTierHint', public.inviter_next_tier_hint(v_existing + 1)
    );
  END IF;

  v_current_unit := public.calculate_inviter_unit_price(v_existing + 1);

  FOR v_i IN 1..v_qty LOOP
    v_unit := public.calculate_inviter_unit_price(v_existing + v_i);
    v_total := v_total + v_unit;
  END LOOP;

  v_next_threshold := public.inviter_next_threshold(v_existing + v_qty);
  v_next_price := CASE WHEN v_next_threshold IS NOT NULL
    THEN public.calculate_inviter_unit_price(v_next_threshold)
    ELSE NULL END;
  v_until := CASE WHEN v_next_threshold IS NOT NULL
    THEN v_next_threshold - (v_existing + v_qty)
    ELSE NULL END;

  RETURN jsonb_build_object(
    'quantity', v_qty,
    'existingCount', v_existing,
    'totalFcfa', v_total,
    'unitPriceFcfa', v_current_unit,
    'averageUnitFcfa', ROUND(v_total::NUMERIC / v_qty)::INTEGER,
    'tierLabel', public.inviter_tier_label(v_existing + 1),
    'nextTierHint', CASE
      WHEN v_until IS NOT NULL AND v_until > 0 AND v_next_price IS NOT NULL THEN
        format('Encore %s accès pour débloquer %s FCFA.', v_until, v_next_price)
      ELSE NULL
    END,
    'currency', 'XOF'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.inviter_tier_label(p_access_index INTEGER)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_access_index >= 501 THEN '501+'
    WHEN p_access_index >= 301 THEN '301–500'
    WHEN p_access_index >= 151 THEN '151–300'
    WHEN p_access_index >= 100 THEN '100–150'
    WHEN p_access_index >= 31 THEN '31–99'
    WHEN p_access_index >= 16 THEN '16–30'
    ELSE '1–15'
  END;
$$;

CREATE OR REPLACE FUNCTION public.inviter_next_threshold(p_after_index INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_after_index < 15 THEN 16
    WHEN p_after_index < 30 THEN 31
    WHEN p_after_index < 99 THEN 100
    WHEN p_after_index < 150 THEN 151
    WHEN p_after_index < 300 THEN 301
    WHEN p_after_index < 500 THEN 501
    ELSE NULL
  END;
$$;

CREATE OR REPLACE FUNCTION public.inviter_next_tier_hint(p_next_index INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_th INTEGER;
  v_price INTEGER;
  v_until INTEGER;
BEGIN
  v_th := public.inviter_next_threshold(p_next_index - 1);
  IF v_th IS NULL THEN RETURN NULL; END IF;
  v_until := v_th - p_next_index + 1;
  v_price := public.calculate_inviter_unit_price(v_th);
  IF v_until <= 0 THEN RETURN NULL; END IF;
  RETURN format('Encore %s accès pour débloquer %s FCFA.', v_until, v_price);
END;
$$;

-- Devis complet VENDRE (délègue calculate_invora_commission)
CREATE OR REPLACE FUNCTION public.calculate_vendre_pricing_quote(p_price_fcfa INTEGER, p_quantity INTEGER DEFAULT 1)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_row RECORD;
  v_qty INTEGER := GREATEST(COALESCE(p_quantity, 1), 1);
BEGIN
  SELECT * INTO v_row FROM public.calculate_invora_commission(p_price_fcfa);
  RETURN jsonb_build_object(
    'priceFcfa', v_row.price_fcfa,
    'quantity', v_qty,
    'clientTotalFcfa', v_row.price_fcfa * v_qty,
    'commissionFcfa', v_row.commission_fcfa,
    'organizerNetFcfa', v_row.organizer_net_fcfa,
    'commissionPerTicketFcfa', v_row.commission_fcfa,
    'currency', v_row.currency
  );
END;
$$;

-- Figement répartition à la validation paiement
CREATE OR REPLACE FUNCTION public.freeze_finance_settlement(p_transaction_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx public.transactions%ROWTYPE;
  v_settlement_id UUID;
  v_gross INTEGER;
BEGIN
  SELECT * INTO v_tx FROM public.transactions WHERE id = p_transaction_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'transaction_not_found'; END IF;
  IF v_tx.payment_status <> 'paid' THEN
    RAISE EXCEPTION 'payment_not_paid';
  END IF;

  v_gross := COALESCE(v_tx.gross_fcfa, v_tx.amount_cents);

  INSERT INTO public.finance_settlements (
    transaction_id,
    event_id,
    universe,
    gross_fcfa,
    invora_commission_fcfa,
    partner_commission_fcfa,
    organizer_net_fcfa,
    reference_code,
    payment_status
  ) VALUES (
    v_tx.id,
    v_tx.event_id,
    COALESCE(v_tx.universe, 'vendre'::public.finance_universe),
    v_gross,
    COALESCE(v_tx.commission_fcfa, 0),
    COALESCE(v_tx.partner_commission_fcfa, 0),
    COALESCE(v_tx.organizer_net_fcfa, GREATEST(v_gross - COALESCE(v_tx.commission_fcfa, 0), 0)),
    v_tx.reference_code,
    v_tx.payment_status
  )
  ON CONFLICT (transaction_id) DO NOTHING
  RETURNING id INTO v_settlement_id;

  IF v_settlement_id IS NULL THEN
    SELECT id INTO v_settlement_id FROM public.finance_settlements WHERE transaction_id = p_transaction_id;
    RETURN v_settlement_id;
  END IF;

  INSERT INTO public.finance_audit_log (entity_type, entity_id, action, amount_fcfa, metadata)
  VALUES ('settlement', v_settlement_id, 'frozen', v_gross, jsonb_build_object('transaction_id', p_transaction_id));

  RETURN v_settlement_id;
END;
$$;

-- Solde organisateur (agrégat)
CREATE OR REPLACE FUNCTION public.get_organizer_balance_summary(p_organizer_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_available INTEGER;
  v_pending INTEGER;
  v_withdrawn INTEGER;
  v_row public.organizer_balances%ROWTYPE;
BEGIN
  IF p_organizer_id IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT COALESCE(SUM(fs.organizer_net_fcfa), 0) INTO v_available
  FROM public.finance_settlements fs
  JOIN public.events e ON e.id = fs.event_id
  WHERE e.organizer_id = p_organizer_id AND fs.payment_status = 'paid';

  SELECT COALESCE(SUM(amount_fcfa), 0) INTO v_withdrawn
  FROM public.organizer_payout_requests
  WHERE organizer_id = p_organizer_id AND status = 'paid';

  SELECT COALESCE(SUM(amount_fcfa), 0) INTO v_pending
  FROM public.organizer_payout_requests
  WHERE organizer_id = p_organizer_id AND status = 'pending';

  v_available := GREATEST(v_available - v_withdrawn - v_pending, 0);

  INSERT INTO public.organizer_balances (organizer_id, available_fcfa, pending_fcfa, withdrawn_fcfa, updated_at)
  VALUES (p_organizer_id, v_available, v_pending, v_withdrawn, NOW())
  ON CONFLICT (organizer_id) DO UPDATE
  SET available_fcfa = EXCLUDED.available_fcfa,
      pending_fcfa = EXCLUDED.pending_fcfa,
      withdrawn_fcfa = EXCLUDED.withdrawn_fcfa,
      updated_at = NOW();

  RETURN jsonb_build_object(
    'availableFcfa', v_available,
    'pendingFcfa', v_pending,
    'withdrawnFcfa', v_withdrawn,
    'currency', 'XOF'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.create_organizer_payout_request(p_amount_fcfa INTEGER)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_bal JSONB;
  v_available INTEGER;
BEGIN
  v_bal := public.get_organizer_balance_summary(auth.uid());
  v_available := (v_bal->>'availableFcfa')::INTEGER;
  IF p_amount_fcfa > v_available THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  INSERT INTO public.organizer_payout_requests (organizer_id, amount_fcfa)
  VALUES (auth.uid(), p_amount_fcfa)
  RETURNING id INTO v_id;

  INSERT INTO public.finance_audit_log (entity_type, entity_id, action, amount_fcfa, metadata)
  VALUES ('organizer_payout', v_id, 'requested', p_amount_fcfa, jsonb_build_object('organizer_id', auth.uid()));

  RETURN v_id;
END;
$$;

-- Rapports (structure JSON — export CSV côté client)
CREATE OR REPLACE FUNCTION public.get_finance_report(
  p_scope TEXT,
  p_event_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows JSONB;
BEGIN
  IF p_scope = 'organizer' THEN
    SELECT COALESCE(jsonb_agg(row_to_json(x)), '[]'::JSONB) INTO v_rows
    FROM (
      SELECT
        fs.created_at AS at,
        fs.reference_code AS reference,
        fs.universe::TEXT,
        fs.gross_fcfa,
        fs.invora_commission_fcfa,
        fs.partner_commission_fcfa,
        fs.organizer_net_fcfa,
        fs.payment_status::TEXT AS status
      FROM public.finance_settlements fs
      JOIN public.events e ON e.id = fs.event_id
      WHERE e.organizer_id = auth.uid()
        AND (p_event_id IS NULL OR fs.event_id = p_event_id)
      ORDER BY fs.created_at DESC
      LIMIT 500
    ) x;
  ELSIF p_scope = 'partner' THEN
    SELECT COALESCE(jsonb_agg(row_to_json(x)), '[]'::JSONB) INTO v_rows
    FROM (
      SELECT
        pcl.created_at AS at,
        pcl.commission_fcfa,
        pcl.universe::TEXT,
        pcl.reference_type,
        pcl.frozen_at
      FROM public.partner_commission_ledger pcl
      JOIN public.partners p ON p.id = pcl.partner_id
      WHERE p.user_id = auth.uid()
      ORDER BY pcl.created_at DESC
      LIMIT 500
    ) x;
  ELSE
    SELECT COALESCE(jsonb_agg(row_to_json(x)), '[]'::JSONB) INTO v_rows
    FROM (
      SELECT
        fs.created_at AS at,
        fs.gross_fcfa,
        fs.invora_commission_fcfa,
        fs.organizer_net_fcfa,
        fs.universe::TEXT
      FROM public.finance_settlements fs
      ORDER BY fs.created_at DESC
      LIMIT 200
    ) x;
  END IF;

  RETURN jsonb_build_object('scope', p_scope, 'rows', v_rows, 'exportReady', TRUE);
END;
$$;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizer_payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "finance_audit_no_delete" ON public.finance_audit_log FOR DELETE USING (FALSE);

CREATE POLICY "organizer_balances_own" ON public.organizer_balances
  FOR SELECT USING (organizer_id = auth.uid());

CREATE POLICY "organizer_payouts_own" ON public.organizer_payout_requests
  FOR ALL USING (organizer_id = auth.uid()) WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "finance_settlements_organizer" ON public.finance_settlements
  FOR SELECT USING (
    public.has_event_role(event_id, ARRAY['owner', 'organizer'])
  );

GRANT EXECUTE ON FUNCTION public.calculate_inviter_unit_price(INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.calculate_inviter_pricing_quote(INTEGER, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.calculate_vendre_pricing_quote(INTEGER, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.freeze_finance_settlement(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organizer_balance_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_organizer_payout_request(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_finance_report(TEXT, UUID) TO authenticated;
