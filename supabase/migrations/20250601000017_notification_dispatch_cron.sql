-- PHASE 11F suite — Claim/finalize pour Edge + cron pg_net

-- Réserve un lot pour envoi externe (email / whatsapp / sms / push)
CREATE OR REPLACE FUNCTION public.claim_notification_queue_batch(p_limit INTEGER DEFAULT 25)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.notification_queue%ROWTYPE;
  v_items JSONB := '[]'::JSONB;
  v_kind TEXT;
  v_event_id UUID;
BEGIN
  FOR v_row IN
    SELECT * FROM public.notification_queue
    WHERE status IN ('pending', 'queued', 'failed')
      AND channel IN ('email', 'whatsapp', 'sms', 'push')
      AND attempt_count < max_attempts
      AND (next_retry_at IS NULL OR next_retry_at <= NOW())
      AND scheduled_at <= NOW()
    ORDER BY scheduled_at ASC
    LIMIT GREATEST(1, LEAST(p_limit, 100))
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.notification_queue
    SET status = 'sending', attempt_count = attempt_count + 1
    WHERE id = v_row.id;

    UPDATE public.notification_deliveries
    SET status = 'sending'
    WHERE queue_id = v_row.id;

    SELECT ne.kind, ne.event_id INTO v_kind, v_event_id
    FROM public.notification_events ne
    WHERE ne.id = v_row.notification_event_id;

    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'queueId', v_row.id,
      'channel', v_row.channel,
      'recipientEmail', v_row.recipient_email,
      'recipientPhone', v_row.recipient_phone,
      'recipientUserId', v_row.recipient_user_id,
      'subject', v_row.rendered_subject,
      'body', v_row.rendered_body,
      'kind', v_kind,
      'eventId', v_event_id,
      'attempt', v_row.attempt_count
    ));
  END LOOP;

  RETURN jsonb_build_object('items', v_items, 'count', jsonb_array_length(v_items));
END;
$$;

-- Finalise après envoi Edge (succès ou échec + retry)
CREATE OR REPLACE FUNCTION public.finalize_notification_dispatch(
  p_queue_id UUID,
  p_success BOOLEAN,
  p_provider TEXT DEFAULT 'invora_edge',
  p_provider_message_id TEXT DEFAULT NULL,
  p_error TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.notification_queue%ROWTYPE;
  v_delivery_id UUID;
  v_backoff INTERVAL;
  v_kind TEXT;
  v_event_id UUID;
BEGIN
  SELECT * INTO v_row FROM public.notification_queue WHERE id = p_queue_id FOR UPDATE;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT id INTO v_delivery_id FROM public.notification_deliveries WHERE queue_id = p_queue_id LIMIT 1;

  SELECT ne.kind, ne.event_id INTO v_kind, v_event_id
  FROM public.notification_events ne WHERE ne.id = v_row.notification_event_id;

  IF p_success THEN
    UPDATE public.notification_deliveries
    SET
      status = 'delivered',
      provider = p_provider,
      provider_message_id = p_provider_message_id,
      sent_at = COALESCE(sent_at, NOW()),
      delivered_at = NOW()
    WHERE id = v_delivery_id;

    UPDATE public.notification_queue
    SET status = 'delivered', processed_at = NOW(), last_error = NULL
    WHERE id = p_queue_id;

    INSERT INTO public.notification_logs (
      notification_event_id, queue_id, delivery_id,
      recipient_user_id, event_id, kind, channel, status, provider, message, metadata
    ) VALUES (
      v_row.notification_event_id, p_queue_id, v_delivery_id,
      v_row.recipient_user_id, v_event_id, v_kind, v_row.channel, 'delivered', p_provider,
      'Delivered via edge',
      jsonb_build_object('providerMessageId', p_provider_message_id)
    );
  ELSE
    v_backoff := (INTERVAL '1 minute' * power(2, LEAST(v_row.attempt_count, 6)));

    UPDATE public.notification_deliveries
    SET status = 'failed', failed_at = NOW(), error_message = p_error, provider = p_provider
    WHERE id = v_delivery_id;

    UPDATE public.notification_queue
    SET status = 'failed', last_error = p_error, next_retry_at = NOW() + v_backoff
    WHERE id = p_queue_id;

    INSERT INTO public.notification_logs (
      notification_event_id, queue_id, delivery_id,
      recipient_user_id, event_id, kind, channel, status, provider, message, metadata
    ) VALUES (
      v_row.notification_event_id, p_queue_id, v_delivery_id,
      v_row.recipient_user_id, v_event_id, v_kind, v_row.channel, 'failed', p_provider,
      COALESCE(p_error, 'dispatch_failed'),
      jsonb_build_object('attempt', v_row.attempt_count, 'nextRetryAt', NOW() + v_backoff)
    );
  END IF;
END;
$$;

-- In-app : traitement SQL rapide (pas d'API externe)
CREATE OR REPLACE FUNCTION public.process_notification_in_app_batch(p_limit INTEGER DEFAULT 50)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.notification_queue%ROWTYPE;
  v_processed INTEGER := 0;
BEGIN
  FOR v_row IN
    SELECT * FROM public.notification_queue
    WHERE status IN ('pending', 'queued')
      AND channel = 'in_app'
      AND scheduled_at <= NOW()
    ORDER BY scheduled_at ASC
    LIMIT GREATEST(1, LEAST(p_limit, 100))
    FOR UPDATE SKIP LOCKED
  LOOP
    UPDATE public.notification_queue
    SET status = 'delivered', processed_at = NOW()
    WHERE id = v_row.id;

    UPDATE public.notification_deliveries
    SET status = 'delivered', provider = 'in_app', sent_at = NOW(), delivered_at = NOW()
    WHERE queue_id = v_row.id;

    v_processed := v_processed + 1;
  END LOOP;

  RETURN jsonb_build_object('processed', v_processed);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_notification_queue_batch(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.finalize_notification_dispatch(UUID, BOOLEAN, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_notification_in_app_batch(INTEGER) TO service_role;

-- Cron : pg_cron + pg_net (activer extensions Supabase Dashboard si besoin)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Planification (désactive l'ancien job si présent)
DO $cron$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'invora-notification-dispatch') THEN
    PERFORM cron.unschedule('invora-notification-dispatch');
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN insufficient_privilege THEN NULL;
END;
$cron$;

-- Nécessite les secrets Vault : project_url + service_role_key (voir NOTIFICATION_CRON_SETUP.md)
DO $schedule$
DECLARE
  v_url TEXT;
  v_key TEXT;
BEGIN
  BEGIN
    SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'project_url' LIMIT 1;
    SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Vault secrets manquants — cron non planifié. Voir NOTIFICATION_CRON_SETUP.md';
    RETURN;
  END;

  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE NOTICE 'project_url ou service_role_key absent — cron non planifié';
    RETURN;
  END IF;

  PERFORM cron.schedule(
    'invora-notification-dispatch',
    '* * * * *',
    format(
      $cmd$
      SELECT net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer %s'
        ),
        body := '{"limit":40}'::jsonb,
        timeout_milliseconds := 30000
      );
      $cmd$,
      rtrim(v_url, '/') || '/functions/v1/notification-dispatch',
      v_key
    )
  );
  RAISE NOTICE 'Cron invora-notification-dispatch planifié (chaque minute)';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Cron non planifié: %', SQLERRM;
END;
$schedule$;
