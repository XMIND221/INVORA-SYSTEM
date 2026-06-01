-- PHASE 5 — PARTNER ENGINE (distribution, commissions serveur, wallet, retraits)

CREATE TYPE public.partner_universe AS ENUM ('inviter', 'vendre');

CREATE TYPE public.partner_tracking_kind AS ENUM ('click', 'open', 'conversion');

CREATE TYPE public.partner_withdrawal_status AS ENUM (
  'pending',
  'approved',
  'paid',
  'rejected'
);

-- Campagnes partenaire × événement
CREATE TABLE public.partner_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners (id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  universe public.partner_universe NOT NULL,
  campaign_code TEXT NOT NULL UNIQUE,
  share_path TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (partner_id, event_id)
);

CREATE INDEX idx_partner_campaigns_partner ON public.partner_campaigns (partner_id);
CREATE INDEX idx_partner_campaigns_code ON public.partner_campaigns (campaign_code);

-- Tracking horodaté
CREATE TABLE public.partner_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.partner_campaigns (id) ON DELETE CASCADE,
  kind public.partner_tracking_kind NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_partner_tracking_campaign ON public.partner_tracking_events (campaign_id, created_at DESC);

-- Commissions figées (marge INVORA uniquement)
CREATE TABLE public.partner_commission_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners (id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.partner_campaigns (id) ON DELETE SET NULL,
  universe public.partner_universe NOT NULL,
  commission_fcfa INTEGER NOT NULL CHECK (commission_fcfa >= 0),
  reference_type TEXT NOT NULL,
  reference_id UUID,
  transaction_id UUID REFERENCES public.transactions (id) ON DELETE SET NULL,
  frozen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_partner_commission_partner ON public.partner_commission_ledger (partner_id);

-- Demandes de retrait
CREATE TABLE public.partner_withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners (id) ON DELETE CASCADE,
  amount_fcfa INTEGER NOT NULL CHECK (amount_fcfa > 0),
  status public.partner_withdrawal_status NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  metadata JSONB
);

CREATE INDEX idx_partner_withdrawals_partner ON public.partner_withdrawal_requests (partner_id);

-- Media kit généré (métadonnées)
CREATE TABLE public.partner_media_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  asset_key TEXT NOT NULL,
  label TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, asset_key)
);

-- Commission INVITER (par palier d'accès convertis sur la période de calcul)
CREATE OR REPLACE FUNCTION public.calculate_partner_commission_inviter(p_access_count INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_access_count >= 501 THEN 125
    WHEN p_access_count >= 301 THEN 100
    WHEN p_access_count >= 101 THEN 75
    WHEN p_access_count >= 1 THEN 50
    ELSE 0
  END;
$$;

-- Commission VENDRE (par prix billet FCFA — marge INVORA)
CREATE OR REPLACE FUNCTION public.calculate_partner_commission_vendre(p_ticket_price_fcfa INTEGER)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_ticket_price_fcfa >= 100000 THEN 500
    WHEN p_ticket_price_fcfa >= 50000 THEN 300
    WHEN p_ticket_price_fcfa >= 20000 THEN 200
    WHEN p_ticket_price_fcfa >= 10000 THEN 150
    WHEN p_ticket_price_fcfa >= 5000 THEN 100
    ELSE 0
  END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_partner_commission(
  p_universe public.partner_universe,
  p_metric INTEGER
)
RETURNS TABLE (universe public.partner_universe, metric INTEGER, commission_fcfa INTEGER)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_universe = 'inviter' THEN
    RETURN QUERY SELECT p_universe, p_metric, public.calculate_partner_commission_inviter(p_metric);
  ELSE
    RETURN QUERY SELECT p_universe, p_metric, public.calculate_partner_commission_vendre(p_metric);
  END IF;
END;
$$;

-- Attribution conversion + commission figée
CREATE OR REPLACE FUNCTION public.record_partner_conversion(
  p_campaign_code TEXT,
  p_reference_type TEXT,
  p_reference_id UUID,
  p_metric INTEGER,
  p_transaction_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign public.partner_campaigns%ROWTYPE;
  v_commission INTEGER;
  v_ledger_id UUID;
BEGIN
  SELECT * INTO v_campaign FROM public.partner_campaigns WHERE campaign_code = p_campaign_code;
  IF NOT FOUND THEN RAISE EXCEPTION 'campaign_not_found'; END IF;

  v_commission := CASE
    WHEN v_campaign.universe = 'inviter' THEN public.calculate_partner_commission_inviter(p_metric)
    ELSE public.calculate_partner_commission_vendre(p_metric)
  END;

  INSERT INTO public.partner_tracking_events (campaign_id, kind, metadata)
  VALUES (v_campaign.id, 'conversion', jsonb_build_object('reference_type', p_reference_type, 'reference_id', p_reference_id));

  INSERT INTO public.partner_commission_ledger (
    partner_id, campaign_id, universe, commission_fcfa, reference_type, reference_id, transaction_id
  )
  VALUES (
    v_campaign.partner_id, v_campaign.id, v_campaign.universe, v_commission,
    p_reference_type, p_reference_id, p_transaction_id
  )
  RETURNING id INTO v_ledger_id;

  RETURN v_ledger_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_partner_withdrawal_request(
  p_partner_id UUID,
  p_amount_fcfa INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.partner_withdrawal_requests (partner_id, amount_fcfa, status)
  VALUES (p_partner_id, p_amount_fcfa, 'pending')
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

ALTER TABLE public.partner_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_commission_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_media_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partner_campaigns_own" ON public.partner_campaigns
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.partners p WHERE p.id = partner_id AND p.user_id = auth.uid())
  );

CREATE POLICY "partner_commission_own" ON public.partner_commission_ledger
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.partners p WHERE p.id = partner_id AND p.user_id = auth.uid())
  );

CREATE POLICY "partner_withdrawals_own" ON public.partner_withdrawal_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.partners p WHERE p.id = partner_id AND p.user_id = auth.uid())
  );

CREATE POLICY "partner_media_public_read" ON public.partner_media_kits
  FOR SELECT USING (TRUE);

GRANT EXECUTE ON FUNCTION public.calculate_partner_commission_inviter(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_partner_commission_vendre(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_partner_commission(public.partner_universe, INTEGER) TO anon, authenticated;
