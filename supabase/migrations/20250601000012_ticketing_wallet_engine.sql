-- PHASE 11B — Ticketing Engine & Wallet (source de vérité billets, QR, claim, distribution)

-- Vue wallet enrichie (titre / date / lieu événement) — DROP requis pour nouvelles colonnes
DROP VIEW IF EXISTS public.wallet_access_unified CASCADE;

CREATE VIEW public.wallet_access_unified AS
SELECT
  i.id AS access_id,
  i.event_id,
  e.title AS event_title,
  e.starts_at AS event_starts_at,
  e.location AS event_location,
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
JOIN public.events e ON e.id = i.event_id
UNION ALL
SELECT
  t.id,
  t.event_id,
  e.title,
  e.starts_at,
  e.location,
  trim(COALESCE(t.buyer_first_name, '') || ' ' || COALESCE(t.buyer_last_name, '')),
  t.buyer_phone,
  t.buyer_email,
  tt.name,
  t.qr_payload,
  t.unique_code,
  CASE
    WHEN t.scanned_at IS NOT NULL THEN 'used'::public.invora_access_status
    WHEN t.payment_status = 'refunded' THEN 'cancelled'::public.invora_access_status
    WHEN t.payment_status = 'failed' THEN 'cancelled'::public.invora_access_status
    WHEN t.payment_status <> 'paid' THEN 'created'::public.invora_access_status
    WHEN t.claimed THEN 'claimed'::public.invora_access_status
    ELSE 'distributed'::public.invora_access_status
  END,
  t.claimed,
  t.claimed_at,
  t.claimed_by,
  t.user_id,
  COALESCE(t.purchased_at, t.created_at),
  'vendre'::public.invora_access_universe,
  'ticket'::TEXT,
  t.access_token
FROM public.tickets t
JOIN public.ticket_types tt ON tt.id = t.ticket_type_id
JOIN public.events e ON e.id = t.event_id;

-- Journal distribution billet
CREATE TABLE IF NOT EXISTS public.ticket_distribution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets (id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'whatsapp', 'link', 'download')),
  distributed_by UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_distribution_ticket ON public.ticket_distribution_log (ticket_id, created_at DESC);

ALTER TABLE public.ticket_distribution_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ticket_distribution_insert_auth" ON public.ticket_distribution_log
  FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "ticket_distribution_select_own" ON public.ticket_distribution_log
  FOR SELECT USING (
    distributed_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.tickets t
      WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR t.claimed_by = auth.uid())
    )
  );

-- Billet public (lecture par access_token, payé uniquement)
CREATE OR REPLACE FUNCTION public.get_public_ticket_by_token(p_access_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket public.tickets%ROWTYPE;
  v_event public.events%ROWTYPE;
  v_type public.ticket_types%ROWTYPE;
BEGIN
  SELECT * INTO v_ticket FROM public.tickets WHERE access_token = trim(p_access_token);
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_event FROM public.events WHERE id = v_ticket.event_id;
  SELECT * INTO v_type FROM public.ticket_types WHERE id = v_ticket.ticket_type_id;

  RETURN jsonb_build_object(
    'ticket', jsonb_build_object(
      'id', v_ticket.id,
      'eventId', v_ticket.event_id,
      'ticketTypeId', v_ticket.ticket_type_id,
      'ticketTypeName', v_type.name,
      'uniqueCode', v_ticket.unique_code,
      'accessToken', v_ticket.access_token,
      'qrPayload', v_ticket.qr_payload,
      'buyerFirstName', v_ticket.buyer_first_name,
      'buyerLastName', v_ticket.buyer_last_name,
      'buyerPhone', v_ticket.buyer_phone,
      'buyerEmail', v_ticket.buyer_email,
      'paymentStatus', v_ticket.payment_status,
      'status', v_ticket.status,
      'claimed', v_ticket.claimed,
      'claimedAt', v_ticket.claimed_at,
      'claimedBy', v_ticket.claimed_by,
      'userId', v_ticket.user_id,
      'scannedAt', v_ticket.scanned_at,
      'purchasedAt', COALESCE(v_ticket.purchased_at, v_ticket.created_at),
      'transactionId', v_ticket.transaction_id
    ),
    'event', jsonb_build_object(
      'id', v_event.id,
      'title', v_event.title,
      'location', v_event.location,
      'startsAt', v_event.starts_at,
      'endsAt', v_event.ends_at,
      'coverUrl', v_event.cover_url
    )
  );
END;
$$;

-- Types de billets publics (événement UUID ou slug)
CREATE OR REPLACE FUNCTION public.list_public_ticket_types(p_event_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
  v_status public.ticketing_status;
BEGIN
  SELECT e.id, e.ticketing_status INTO v_event_id, v_status
  FROM public.events e
  WHERE (e.id::TEXT = p_event_key OR e.slug = p_event_key)
    AND e.universe = 'vendre'
  LIMIT 1;

  IF v_event_id IS NULL THEN
    RETURN jsonb_build_object('eventId', NULL, 'ticketingStatus', 'draft', 'types', '[]'::JSONB);
  END IF;

  RETURN jsonb_build_object(
    'eventId', v_event_id,
    'ticketingStatus', COALESCE(v_status::TEXT, 'draft'),
    'types', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', tt.id,
        'eventId', tt.event_id,
        'code', tt.code,
        'name', tt.name,
        'description', tt.description,
        'priceFcfa', tt.price_cents,
        'commissionFcfa', tt.commission_fcfa,
        'organizerNetFcfa', tt.organizer_net_fcfa,
        'quantity', tt.quantity,
        'soldCount', tt.sold_count,
        'isActive', tt.is_active,
        'ticketingStatus', tt.ticketing_status
      ) ORDER BY tt.price_cents)
      FROM public.ticket_types tt
      WHERE tt.event_id = v_event_id AND tt.is_active = TRUE
    ), '[]'::JSONB)
  );
END;
$$;

-- Billets émis pour une transaction (post-paiement)
CREATE OR REPLACE FUNCTION public.get_tickets_for_transaction(p_transaction_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', t.id,
    'accessToken', t.access_token,
    'uniqueCode', t.unique_code,
    'paymentStatus', t.payment_status
  ) ORDER BY t.created_at), '[]'::JSONB)
  FROM public.tickets t
  WHERE t.transaction_id = p_transaction_id AND t.payment_status = 'paid';
$$;

-- Billets pour tentative de paiement
CREATE OR REPLACE FUNCTION public.get_tickets_for_payment_attempt(p_payment_attempt_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_tickets_for_transaction(pa.transaction_id)
  FROM public.payment_attempts pa
  WHERE pa.id = p_payment_attempt_id;
$$;

-- Distribution (audit)
CREATE OR REPLACE FUNCTION public.log_ticket_distribution(
  p_access_token TEXT,
  p_channel TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket public.tickets%ROWTYPE;
  v_log_id UUID;
BEGIN
  SELECT * INTO v_ticket FROM public.tickets WHERE access_token = trim(p_access_token);
  IF NOT FOUND THEN RAISE EXCEPTION 'ticket_not_found'; END IF;
  IF v_ticket.payment_status <> 'paid' THEN RAISE EXCEPTION 'payment_required'; END IF;

  INSERT INTO public.ticket_distribution_log (ticket_id, event_id, channel, distributed_by)
  VALUES (v_ticket.id, v_ticket.event_id, p_channel, p_user_id)
  RETURNING id INTO v_log_id;

  INSERT INTO public.access_audit_log (access_id, event_id, user_id, action, metadata)
  VALUES (v_ticket.id, v_ticket.event_id, p_user_id, 'distributed', jsonb_build_object('channel', p_channel));

  RETURN v_log_id;
END;
$$;

-- Funnel billetterie (analytics serveur)
CREATE OR REPLACE FUNCTION public.record_ticketing_funnel(
  p_event_id UUID,
  p_action TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_action = 'page_view' THEN
    UPDATE public.event_metrics SET page_views = page_views + 1, updated_at = NOW()
    WHERE event_id = p_event_id;
  ELSIF p_action = 'cart_add' THEN
    UPDATE public.event_metrics SET cart_adds = cart_adds + 1, updated_at = NOW()
    WHERE event_id = p_event_id;
  END IF;
END;
$$;

-- Analytics VENDRE organisateur
CREATE OR REPLACE FUNCTION public.get_vendre_ticketing_analytics(p_event_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'pageViews', COALESCE(em.page_views, 0),
    'cartAdds', COALESCE(em.cart_adds, 0),
    'purchases', COALESCE(em.purchases_count, 0),
    'conversionRate', COALESCE(em.conversion_rate, 0),
    'ticketsSold', (
      SELECT COUNT(*)::INTEGER FROM public.tickets t
      WHERE t.event_id = p_event_id AND t.payment_status = 'paid'
    ),
    'ticketsUsed', (
      SELECT COUNT(*)::INTEGER FROM public.tickets t
      WHERE t.event_id = p_event_id AND t.scanned_at IS NOT NULL
    ),
    'ticketsRefunded', (
      SELECT COUNT(*)::INTEGER FROM public.tickets t
      WHERE t.event_id = p_event_id AND t.payment_status = 'refunded'
    ),
    'grossRevenueFcfa', COALESCE(em.organizer_revenue_fcfa, 0) + COALESCE(em.invora_commission_fcfa, 0),
    'organizerRevenueFcfa', COALESCE(em.organizer_revenue_fcfa, 0),
    'invoraCommissionFcfa', COALESCE(em.invora_commission_fcfa, 0),
    'attendanceRate', CASE
      WHEN (SELECT COUNT(*) FROM public.tickets t WHERE t.event_id = p_event_id AND t.payment_status = 'paid') > 0
      THEN ROUND(
        100.0 * (SELECT COUNT(*) FROM public.tickets t WHERE t.event_id = p_event_id AND t.scanned_at IS NOT NULL)
        / (SELECT COUNT(*) FROM public.tickets t WHERE t.event_id = p_event_id AND t.payment_status = 'paid'),
        1
      )
      ELSE 0
    END
  )
  FROM public.event_metrics em
  WHERE em.event_id = p_event_id;
$$;

-- Réconciliation enrichie (tokens billets)
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
  v_tokens JSONB;
  v_primary TEXT;
BEGIN
  SELECT * INTO v_attempt FROM public.payment_attempts WHERE id = p_payment_attempt_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'payment_attempt_not_found'; END IF;

  SELECT * INTO v_payment FROM public.payments WHERE payment_attempt_id = p_payment_attempt_id LIMIT 1;

  v_delta := COALESCE(v_payment.amount_fcfa, 0) - v_attempt.amount_fcfa;

  v_tokens := public.get_tickets_for_transaction(v_attempt.transaction_id);
  SELECT elem->>'accessToken' INTO v_primary
  FROM jsonb_array_elements(v_tokens) elem
  LIMIT 1;

  RETURN jsonb_build_object(
    'paymentAttemptId', v_attempt.id,
    'transactionId', v_attempt.transaction_id,
    'expectedFcfa', v_attempt.amount_fcfa,
    'receivedFcfa', COALESCE(v_payment.amount_fcfa, 0),
    'deltaFcfa', v_delta,
    'attemptStatus', v_attempt.payment_status,
    'paymentStatus', COALESCE(v_payment.payment_status::TEXT, 'none'),
    'provider', v_attempt.provider_id,
    'providerRef', v_attempt.provider_ref,
    'reconciled', v_delta = 0 AND v_attempt.payment_status = 'paid' AND v_payment.id IS NOT NULL,
    'ticketTokens', v_tokens,
    'primaryTicketToken', v_primary
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_ticket_by_token(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_public_ticket_types(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_tickets_for_transaction(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_tickets_for_payment_attempt(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_ticket_distribution(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_ticketing_funnel(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_vendre_ticketing_analytics(UUID) TO authenticated;
