-- Fix variable amount in ticket distribution templates (price from ticket_types)
CREATE OR REPLACE FUNCTION public.enqueue_ticket_distribution(
  p_access_token TEXT,
  p_channel TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket public.tickets%ROWTYPE;
  v_event public.events%ROWTYPE;
  v_type public.ticket_types%ROWTYPE;
  v_log_id UUID;
  v_notif_ch public.notification_channel[] := ARRAY[]::public.notification_channel[];
  v_vars JSONB;
BEGIN
  SELECT * INTO v_ticket FROM public.tickets WHERE access_token = trim(p_access_token);
  IF NOT FOUND THEN RAISE EXCEPTION 'ticket_not_found'; END IF;
  IF v_ticket.payment_status <> 'paid' THEN RAISE EXCEPTION 'payment_required'; END IF;

  SELECT * INTO v_event FROM public.events WHERE id = v_ticket.event_id;
  SELECT * INTO v_type FROM public.ticket_types WHERE id = v_ticket.ticket_type_id;

  INSERT INTO public.ticket_distribution_log (ticket_id, event_id, channel, distributed_by)
  VALUES (v_ticket.id, v_ticket.event_id, p_channel, p_user_id)
  RETURNING id INTO v_log_id;

  IF p_channel = 'email' THEN
    v_notif_ch := ARRAY['email', 'in_app']::public.notification_channel[];
  ELSIF p_channel = 'whatsapp' THEN
    v_notif_ch := ARRAY['whatsapp']::public.notification_channel[];
  ELSE
    v_notif_ch := ARRAY['in_app']::public.notification_channel[];
  END IF;

  v_vars := jsonb_build_object(
    'event_name', v_event.title,
    'holder_name', trim(COALESCE(v_ticket.buyer_first_name, '') || ' ' || COALESCE(v_ticket.buyer_last_name, '')),
    'ticket_type', v_type.name,
    'amount', v_type.price_cents,
    'access_code', v_ticket.unique_code,
    'secure_link', '/ticket/' || v_ticket.access_token
  );

  PERFORM public.emit_notification_event(
    'ticket_distributed',
    'vendre',
    v_ticket.event_id,
    p_user_id,
    COALESCE(v_ticket.user_id, v_ticket.claimed_by),
    v_ticket.buyer_email,
    v_ticket.buyer_phone,
    'ticket',
    v_ticket.id,
    v_vars,
    v_notif_ch
  );

  RETURN jsonb_build_object('logId', v_log_id, 'ticketId', v_ticket.id);
END;
$$;
