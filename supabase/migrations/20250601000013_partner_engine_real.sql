-- PHASE 11D — Partner Engine Real (tracking, attribution, wallet, retraits, audit)

-- Profil enrichi (alias logique partner_profiles)
CREATE OR REPLACE VIEW public.partner_profiles AS
SELECT
  p.id AS partner_id,
  p.user_id,
  p.code AS partner_code,
  'PART-' || upper(substr(replace(p.id::text, '-', ''), 1, 6)) AS display_id,
  p.commission_rate,
  p.is_active AS status,
  p.created_at
FROM public.partners p;

-- Clics / conversions (vues auditables)
CREATE OR REPLACE VIEW public.partner_clicks AS
SELECT
  t.id AS click_id,
  c.partner_id,
  c.event_id,
  c.id AS campaign_id,
  c.campaign_code,
  t.metadata,
  t.created_at
FROM public.partner_tracking_events t
JOIN public.partner_campaigns c ON c.id = t.campaign_id
WHERE t.kind = 'click';

CREATE OR REPLACE VIEW public.partner_conversions AS
SELECT
  l.id AS conversion_id,
  l.partner_id,
  l.campaign_id,
  c.event_id,
  l.universe,
  l.commission_fcfa,
  l.reference_type,
  l.reference_id,
  l.transaction_id,
  l.frozen_at AS converted_at
FROM public.partner_commission_ledger l
LEFT JOIN public.partner_campaigns c ON c.id = l.campaign_id;

-- Attributions en cours (session → conversion)
CREATE TABLE IF NOT EXISTS public.partner_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.partner_campaigns (id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES public.partners (id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  visitor_key TEXT,
  utm JSONB,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted_at TIMESTAMPTZ,
  reference_type TEXT,
  reference_id UUID
);

CREATE INDEX IF NOT EXISTS idx_partner_attributions_campaign ON public.partner_attributions (campaign_id, created_at DESC);

-- Audit immuable commissions
CREATE TABLE IF NOT EXISTS public.partner_commission_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners (id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events (id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.partner_campaigns (id) ON DELETE SET NULL,
  ledger_id UUID REFERENCES public.partner_commission_ledger (id) ON DELETE SET NULL,
  conversion_id UUID,
  commission_fcfa INTEGER NOT NULL,
  source TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_commission_audit_partner ON public.partner_commission_audit (partner_id, created_at DESC);

-- Wallet calculé (vue)
CREATE OR REPLACE VIEW public.partner_wallets AS
SELECT
  p.id AS partner_id,
  p.user_id,
  COALESCE((
    SELECT SUM(l.commission_fcfa)::INTEGER FROM public.partner_commission_ledger l WHERE l.partner_id = p.id
  ), 0) AS earned_fcfa,
  COALESCE((
    SELECT SUM(w.amount_fcfa)::INTEGER FROM public.partner_withdrawal_requests w
    WHERE w.partner_id = p.id AND w.status = 'paid'
  ), 0) AS withdrawn_fcfa,
  COALESCE((
    SELECT SUM(w.amount_fcfa)::INTEGER FROM public.partner_withdrawal_requests w
    WHERE w.partner_id = p.id AND w.status IN ('pending', 'approved')
  ), 0) AS pending_fcfa
FROM public.partners p;

-- Historique retraits (alias withdrawal_history)
CREATE OR REPLACE VIEW public.withdrawal_history AS
SELECT
  id,
  partner_id,
  amount_fcfa,
  status,
  requested_at,
  processed_at,
  metadata
FROM public.partner_withdrawal_requests;

CREATE OR REPLACE FUNCTION public._partner_campaign_code(p_partner_code TEXT, p_event_id UUID)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT upper(p_partner_code || '-' || substr(replace(p_event_id::text, '-', ''), 1, 8));
$$;

CREATE OR REPLACE FUNCTION public.ensure_partner_campaign(
  p_partner_id UUID,
  p_event_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner public.partners%ROWTYPE;
  v_event public.events%ROWTYPE;
  v_campaign_id UUID;
  v_code TEXT;
  v_path TEXT;
BEGIN
  SELECT * INTO v_partner FROM public.partners WHERE id = p_partner_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'partner_not_found'; END IF;

  SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'event_not_found'; END IF;

  SELECT id INTO v_campaign_id FROM public.partner_campaigns
  WHERE partner_id = p_partner_id AND event_id = p_event_id;

  IF v_campaign_id IS NOT NULL THEN
    RETURN v_campaign_id;
  END IF;

  v_code := public._partner_campaign_code(v_partner.code, p_event_id);
  v_path := format('/p/%s/%s', v_partner.code, p_event_id);

  INSERT INTO public.partner_campaigns (partner_id, event_id, universe, campaign_code, share_path)
  VALUES (p_partner_id, p_event_id, v_event.universe::public.partner_universe, v_code, v_path)
  RETURNING id INTO v_campaign_id;

  PERFORM public.sync_partner_media_kit_for_event(p_event_id);

  RETURN v_campaign_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_partner_media_kit_for_event(p_event_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.events%ROWTYPE;
  v_count INTEGER := 0;
BEGIN
  SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  INSERT INTO public.partner_media_kits (event_id, asset_key, label, payload) VALUES
    (p_event_id, 'story_ig', 'Story Instagram', jsonb_build_object('format', '9:16', 'eventTitle', v_event.title)),
    (p_event_id, 'story_wa', 'Story WhatsApp', jsonb_build_object('format', '9:16')),
    (p_event_id, 'poster_square', 'Affiche carrée', jsonb_build_object('format', '1:1')),
    (p_event_id, 'poster_vertical', 'Affiche verticale', jsonb_build_object('format', '4:5')),
    (p_event_id, 'banner', 'Bannière', jsonb_build_object('format', '16:9')),
    (p_event_id, 'qr', 'QR partenaire', jsonb_build_object('format', 'QR')),
    (p_event_id, 'copy', 'Texte promotionnel', jsonb_build_object('eventTitle', v_event.title)),
    (p_event_id, 'link', 'Lien promotionnel', jsonb_build_object())
  ON CONFLICT (event_id, asset_key) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_or_create_partner_for_user(p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner public.partners%ROWTYPE;
  v_code TEXT;
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;

  SELECT * INTO v_partner FROM public.partners WHERE user_id = p_user_id;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'id', v_partner.id,
      'userId', v_partner.user_id,
      'partnerCode', v_partner.code,
      'displayId', 'PART-' || upper(substr(replace(v_partner.id::text, '-', ''), 1, 6))
    );
  END IF;

  v_code := upper(substr(replace(p_user_id::text, '-', ''), 1, 8));

  INSERT INTO public.partners (user_id, code, is_active)
  VALUES (p_user_id, v_code, TRUE)
  RETURNING * INTO v_partner;

  RETURN jsonb_build_object(
    'id', v_partner.id,
    'userId', v_partner.user_id,
    'partnerCode', v_partner.code,
    'displayId', 'PART-' || upper(substr(replace(v_partner.id::text, '-', ''), 1, 6))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_partner_campaigns(p_partner_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.events%ROWTYPE;
  v_count INTEGER := 0;
BEGIN
  FOR v_event IN
    SELECT * FROM public.events
    WHERE status IN ('published', 'live') AND visibility = 'public'
  LOOP
    PERFORM public.ensure_partner_campaign(p_partner_id, v_event.id);
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_partner_click(
  p_partner_code TEXT,
  p_event_key TEXT,
  p_visitor_key TEXT DEFAULT NULL,
  p_utm JSONB DEFAULT '{}'::JSONB,
  p_source TEXT DEFAULT 'link'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner public.partners%ROWTYPE;
  v_event_id UUID;
  v_campaign_id UUID;
  v_campaign public.partner_campaigns%ROWTYPE;
  v_attr_id UUID;
BEGIN
  SELECT * INTO v_partner FROM public.partners WHERE upper(code) = upper(trim(p_partner_code));
  IF NOT FOUND THEN RAISE EXCEPTION 'partner_not_found'; END IF;

  SELECT id INTO v_event_id FROM public.events
  WHERE id::TEXT = p_event_key OR slug = p_event_key LIMIT 1;
  IF v_event_id IS NULL THEN RAISE EXCEPTION 'event_not_found'; END IF;

  v_campaign_id := public.ensure_partner_campaign(v_partner.id, v_event_id);
  SELECT * INTO v_campaign FROM public.partner_campaigns WHERE id = v_campaign_id;

  INSERT INTO public.partner_tracking_events (campaign_id, kind, metadata)
  VALUES (v_campaign_id, 'click', jsonb_build_object('utm', p_utm, 'source', p_source, 'visitor', p_visitor_key));

  INSERT INTO public.partner_attributions (campaign_id, partner_id, event_id, visitor_key, utm, source)
  VALUES (v_campaign_id, v_partner.id, v_event_id, p_visitor_key, p_utm, p_source)
  RETURNING id INTO v_attr_id;

  RETURN jsonb_build_object(
    'campaignId', v_campaign_id,
    'campaignCode', v_campaign.campaign_code,
    'eventId', v_event_id,
    'universe', v_campaign.universe,
    'sharePath', v_campaign.share_path,
    'attributionId', v_attr_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_partner_open(p_campaign_code TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campaign public.partner_campaigns%ROWTYPE;
BEGIN
  SELECT * INTO v_campaign FROM public.partner_campaigns WHERE campaign_code = p_campaign_code;
  IF NOT FOUND THEN RAISE EXCEPTION 'campaign_not_found'; END IF;

  INSERT INTO public.partner_tracking_events (campaign_id, kind, metadata)
  VALUES (v_campaign.id, 'open', '{}'::JSONB);
END;
$$;

-- MAJ record_partner_conversion + audit
CREATE OR REPLACE FUNCTION public.record_partner_conversion(
  p_campaign_code TEXT,
  p_reference_type TEXT,
  p_reference_id UUID,
  p_metric INTEGER,
  p_transaction_id UUID DEFAULT NULL,
  p_source TEXT DEFAULT 'conversion'
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
  SELECT * INTO v_campaign FROM public.partner_campaigns WHERE campaign_code = upper(trim(p_campaign_code));
  IF NOT FOUND THEN RAISE EXCEPTION 'campaign_not_found'; END IF;

  v_commission := CASE
    WHEN v_campaign.universe = 'inviter' THEN public.calculate_partner_commission_inviter(p_metric)
    ELSE public.calculate_partner_commission_vendre(p_metric)
  END;

  INSERT INTO public.partner_tracking_events (campaign_id, kind, metadata)
  VALUES (v_campaign.id, 'conversion', jsonb_build_object(
    'reference_type', p_reference_type, 'reference_id', p_reference_id, 'metric', p_metric, 'source', p_source
  ));

  INSERT INTO public.partner_commission_ledger (
    partner_id, campaign_id, universe, commission_fcfa, reference_type, reference_id, transaction_id
  )
  VALUES (
    v_campaign.partner_id, v_campaign.id, v_campaign.universe, v_commission,
    p_reference_type, p_reference_id, p_transaction_id
  )
  RETURNING id INTO v_ledger_id;

  UPDATE public.partner_attributions
  SET converted_at = NOW(), reference_type = p_reference_type, reference_id = p_reference_id
  WHERE id = (
    SELECT a.id FROM public.partner_attributions a
    WHERE a.campaign_id = v_campaign.id AND a.converted_at IS NULL
    ORDER BY a.created_at DESC
    LIMIT 1
  );

  INSERT INTO public.partner_commission_audit (
    partner_id, event_id, campaign_id, ledger_id, conversion_id, commission_fcfa, source, metadata
  )
  VALUES (
    v_campaign.partner_id, v_campaign.event_id, v_campaign.id, v_ledger_id, p_reference_id,
    v_commission, p_source,
    jsonb_build_object('reference_type', p_reference_type, 'metric', p_metric, 'transaction_id', p_transaction_id)
  );

  RETURN v_ledger_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_partner_wallet_summary(p_partner_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'availableFcfa', GREATEST(earned_fcfa - withdrawn_fcfa - pending_fcfa, 0),
    'pendingFcfa', pending_fcfa,
    'withdrawnFcfa', withdrawn_fcfa,
    'earnedFcfa', earned_fcfa
  )
  FROM public.partner_wallets
  WHERE partner_id = p_partner_id;
$$;

CREATE OR REPLACE FUNCTION public.get_partner_dashboard(p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner public.partners%ROWTYPE;
  v_campaigns JSONB;
  v_wallet JSONB;
  v_analytics JSONB;
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;

  SELECT * INTO v_partner FROM public.partners WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('profile', NULL, 'campaigns', '[]'::JSONB);
  END IF;

  PERFORM public.refresh_partner_campaigns(v_partner.id);

  SELECT COALESCE(jsonb_agg(row_to_json(camp)::JSONB ORDER BY camp.event_title), '[]'::JSONB)
  INTO v_campaigns
  FROM (
    SELECT
      pc.id,
      pc.event_id AS "eventId",
      e.title AS "eventTitle",
      to_char(e.starts_at, 'DD MON') AS "dateLabel",
      pc.universe,
      pc.campaign_code AS "campaignCode",
      pc.share_path AS "sharePath",
      pc.is_active AS "isActive",
      COALESCE((SELECT COUNT(*)::INTEGER FROM public.partner_tracking_events t
        WHERE t.campaign_id = pc.id AND t.kind = 'click'), 0) AS clicks,
      COALESCE((SELECT COUNT(*)::INTEGER FROM public.partner_tracking_events t
        WHERE t.campaign_id = pc.id AND t.kind = 'open'), 0) AS opens,
      COALESCE((SELECT COUNT(*)::INTEGER FROM public.partner_commission_ledger l
        WHERE l.campaign_id = pc.id), 0) AS conversions,
      COALESCE((SELECT COUNT(*)::INTEGER FROM public.partner_commission_ledger l
        WHERE l.campaign_id = pc.id AND l.universe = 'inviter'), 0) AS "invitationsGenerated",
      COALESCE((SELECT COUNT(*)::INTEGER FROM public.partner_commission_ledger l
        WHERE l.campaign_id = pc.id AND l.universe = 'vendre'), 0) AS "ticketsSold",
      COALESCE((SELECT SUM(l.commission_fcfa)::INTEGER FROM public.partner_commission_ledger l
        WHERE l.campaign_id = pc.id), 0) AS "commissionFcfa"
    FROM public.partner_campaigns pc
    JOIN public.events e ON e.id = pc.event_id
    WHERE pc.partner_id = v_partner.id
  ) camp;

  v_wallet := public.get_partner_wallet_summary(v_partner.id);

  SELECT jsonb_build_object(
    'clicks', COALESCE(SUM((elem->>'clicks')::INTEGER), 0),
    'opens', COALESCE(SUM((elem->>'opens')::INTEGER), 0),
    'conversions', COALESCE(SUM((elem->>'conversions')::INTEGER), 0),
    'invitations', COALESCE(SUM((elem->>'invitationsGenerated')::INTEGER), 0),
    'sales', COALESCE(SUM((elem->>'ticketsSold')::INTEGER), 0),
    'commissionFcfa', COALESCE(SUM((elem->>'commissionFcfa')::INTEGER), 0),
    'campaigns', COALESCE(jsonb_array_length(v_campaigns), 0)
  )
  INTO v_analytics
  FROM jsonb_array_elements(COALESCE(v_campaigns, '[]'::JSONB)) AS elem;

  RETURN jsonb_build_object(
    'profile', jsonb_build_object(
      'id', v_partner.id,
      'userId', v_partner.user_id,
      'partnerCode', v_partner.code,
      'displayId', 'PART-' || upper(substr(replace(v_partner.id::text, '-', ''), 1, 6))
    ),
    'campaigns', v_campaigns,
    'wallet', v_wallet,
    'analytics', v_analytics
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.list_partner_withdrawals(p_partner_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', w.id,
    'amountFcfa', w.amount_fcfa,
    'status', w.status,
    'requestedAt', w.requested_at,
    'processedAt', w.processed_at
  ) ORDER BY w.requested_at DESC), '[]'::JSONB)
  FROM public.partner_withdrawal_requests w
  WHERE w.partner_id = p_partner_id;
$$;

CREATE OR REPLACE FUNCTION public.list_partner_media_kit(p_event_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'key', m.asset_key,
    'label', m.label,
    'description', COALESCE(m.payload->>'eventTitle', m.label),
    'format', m.payload->>'format'
  ) ORDER BY m.asset_key), '[]'::JSONB)
  FROM public.partner_media_kits m
  WHERE m.event_id = p_event_id;
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
  v_wallet JSONB;
  v_available INTEGER;
  v_id UUID;
BEGIN
  IF p_amount_fcfa <= 0 THEN RAISE EXCEPTION 'invalid_amount'; END IF;

  v_wallet := public.get_partner_wallet_summary(p_partner_id);
  v_available := COALESCE((v_wallet->>'availableFcfa')::INTEGER, 0);

  IF p_amount_fcfa > v_available THEN
    RAISE EXCEPTION 'insufficient_balance';
  END IF;

  INSERT INTO public.partner_withdrawal_requests (partner_id, amount_fcfa, status)
  VALUES (p_partner_id, p_amount_fcfa, 'pending')
  RETURNING id INTO v_id;

  INSERT INTO public.partner_commission_audit (partner_id, commission_fcfa, source, metadata)
  VALUES (p_partner_id, 0, 'withdrawal_requested', jsonb_build_object('withdrawal_id', v_id, 'amount_fcfa', p_amount_fcfa));

  RETURN v_id;
END;
$$;

-- Attribution vente billet (après paiement)
CREATE OR REPLACE FUNCTION public.attribute_partner_vendre_sale(
  p_transaction_id UUID,
  p_campaign_code TEXT,
  p_ticket_price_fcfa INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx public.transactions%ROWTYPE;
  v_price INTEGER;
  v_ticket_id UUID;
BEGIN
  SELECT * INTO v_tx FROM public.transactions WHERE id = p_transaction_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'transaction_not_found'; END IF;

  SELECT t.id INTO v_ticket_id FROM public.tickets t
  WHERE t.transaction_id = p_transaction_id AND t.payment_status = 'paid'
  ORDER BY t.created_at LIMIT 1;

  IF p_ticket_price_fcfa IS NOT NULL THEN
    v_price := p_ticket_price_fcfa;
  ELSE
    SELECT COALESCE(tt.price_cents, v_tx.amount_cents / GREATEST(v_tx.quantity, 1))
    INTO v_price
    FROM public.ticket_types tt
    WHERE tt.id = v_tx.ticket_type_id;
  END IF;

  RETURN public.record_partner_conversion(
    p_campaign_code, 'ticket', COALESCE(v_ticket_id, p_transaction_id), v_price, p_transaction_id, 'vendre_sale'
  );
END;
$$;

ALTER TABLE public.partner_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_commission_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partner_attributions_insert" ON public.partner_attributions
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "partner_attributions_select_own" ON public.partner_attributions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.partners p WHERE p.id = partner_id AND p.user_id = auth.uid())
  );

CREATE POLICY "partner_audit_select_own" ON public.partner_commission_audit
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.partners p WHERE p.id = partner_id AND p.user_id = auth.uid())
  );

CREATE POLICY "partner_tracking_insert" ON public.partner_tracking_events
  FOR INSERT WITH CHECK (TRUE);

GRANT EXECUTE ON FUNCTION public.get_or_create_partner_for_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_partner_campaigns(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_partner_campaign(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_partner_click(TEXT, TEXT, TEXT, JSONB, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_partner_open(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_partner_conversion(TEXT, TEXT, UUID, INTEGER, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.attribute_partner_vendre_sale(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_partner_dashboard(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_partner_wallet_summary(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_partner_withdrawals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_partner_media_kit(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_partner_withdrawal_request(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_partner_media_kit_for_event(UUID) TO authenticated;
