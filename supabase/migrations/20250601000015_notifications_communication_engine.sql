-- PHASE 11F — Notifications & Communication Engine (source unique, traçabilité, retry)

CREATE TYPE public.notification_channel AS ENUM ('email', 'whatsapp', 'in_app', 'push', 'sms');

CREATE TYPE public.notification_delivery_status AS ENUM (
  'pending',
  'queued',
  'sending',
  'sent',
  'delivered',
  'opened',
  'clicked',
  'failed'
);

CREATE TYPE public.notification_category AS ENUM (
  'inviter',
  'vendre',
  'partner',
  'organizer',
  'scanner',
  'rayonner',
  'system'
);

-- Templates (Email / WhatsApp / In-App / Push prep)
CREATE TABLE public.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  channel public.notification_channel NOT NULL,
  category public.notification_category NOT NULL,
  subject_template TEXT,
  body_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (slug, channel)
);

CREATE INDEX idx_notification_templates_slug ON public.notification_templates (slug, channel);

-- Événements métier déclenchés (immuable)
CREATE TABLE public.notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind TEXT NOT NULL,
  category public.notification_category NOT NULL,
  event_id UUID REFERENCES public.events (id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  recipient_user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  entity_type TEXT,
  entity_id UUID,
  variables JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_events_event ON public.notification_events (event_id, created_at DESC);
CREATE INDEX idx_notification_events_kind ON public.notification_events (kind, created_at DESC);

-- File d'envoi
CREATE TABLE public.notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_event_id UUID NOT NULL REFERENCES public.notification_events (id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.notification_templates (id) ON DELETE SET NULL,
  channel public.notification_channel NOT NULL,
  status public.notification_delivery_status NOT NULL DEFAULT 'pending',
  recipient_user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  rendered_subject TEXT,
  rendered_body TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMPTZ,
  last_error TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_queue_pending ON public.notification_queue (status, scheduled_at)
  WHERE status IN ('pending', 'queued', 'sending', 'failed');

-- Livraisons (statuts fins)
CREATE TABLE public.notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL REFERENCES public.notification_queue (id) ON DELETE CASCADE,
  channel public.notification_channel NOT NULL,
  status public.notification_delivery_status NOT NULL DEFAULT 'pending',
  provider TEXT,
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_deliveries_queue ON public.notification_deliveries (queue_id);

-- Préférences utilisateur
CREATE TABLE public.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  sms_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  disabled_kinds TEXT[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit immuable (who / what / channel / template / status / provider)
CREATE TABLE public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_event_id UUID REFERENCES public.notification_events (id) ON DELETE SET NULL,
  queue_id UUID REFERENCES public.notification_queue (id) ON DELETE SET NULL,
  delivery_id UUID REFERENCES public.notification_deliveries (id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  recipient_user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.events (id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  channel public.notification_channel,
  template_slug TEXT,
  status public.notification_delivery_status NOT NULL,
  provider TEXT,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_event ON public.notification_logs (event_id, created_at DESC);

-- Rendu template {{var}}
CREATE OR REPLACE FUNCTION public.render_notification_template(
  p_template TEXT,
  p_variables JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_out TEXT := COALESCE(p_template, '');
  v_key TEXT;
  v_val TEXT;
BEGIN
  IF p_variables IS NULL THEN
    RETURN v_out;
  END IF;
  FOR v_key, v_val IN SELECT key, value::TEXT FROM jsonb_each_text(p_variables)
  LOOP
    v_out := replace(v_out, '{{' || v_key || '}}', COALESCE(v_val, ''));
  END LOOP;
  RETURN v_out;
END;
$$;

-- Préférences effectives pour un canal
CREATE OR REPLACE FUNCTION public.notification_channel_allowed(
  p_user_id UUID,
  p_channel public.notification_channel,
  p_kind TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefs public.notification_preferences%ROWTYPE;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN p_channel IN ('email', 'whatsapp');
  END IF;
  SELECT * INTO v_prefs FROM public.notification_preferences WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;
  IF p_kind = ANY (v_prefs.disabled_kinds) THEN
    RETURN FALSE;
  END IF;
  RETURN CASE p_channel
    WHEN 'email' THEN v_prefs.email_enabled
    WHEN 'whatsapp' THEN v_prefs.whatsapp_enabled
    WHEN 'in_app' THEN v_prefs.in_app_enabled
    WHEN 'push' THEN v_prefs.push_enabled
    WHEN 'sms' THEN v_prefs.sms_enabled
    ELSE FALSE
  END;
END;
$$;

-- Moteur central (SECURITY DEFINER — appelé uniquement par RPC internes / triggers)
CREATE OR REPLACE FUNCTION public.emit_notification_event(
  p_kind TEXT,
  p_category public.notification_category,
  p_event_id UUID DEFAULT NULL,
  p_actor_user_id UUID DEFAULT NULL,
  p_recipient_user_id UUID DEFAULT NULL,
  p_recipient_email TEXT DEFAULT NULL,
  p_recipient_phone TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_variables JSONB DEFAULT '{}',
  p_channels public.notification_channel[] DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ne_id UUID;
  v_tpl public.notification_templates%ROWTYPE;
  v_channel public.notification_channel;
  v_channels public.notification_channel[] := COALESCE(
    p_channels,
    ARRAY['in_app', 'email', 'whatsapp']::public.notification_channel[]
  );
  v_queue_id UUID;
  v_delivery_id UUID;
  v_subject TEXT;
  v_body TEXT;
  v_title TEXT;
BEGIN
  INSERT INTO public.notification_events (
    kind, category, event_id, actor_user_id, recipient_user_id,
    entity_type, entity_id, variables
  ) VALUES (
    p_kind, p_category, p_event_id, p_actor_user_id, p_recipient_user_id,
    p_entity_type, p_entity_id, COALESCE(p_variables, '{}'::JSONB)
  )
  RETURNING id INTO v_ne_id;

  FOREACH v_channel IN ARRAY v_channels
  LOOP
    IF NOT public.notification_channel_allowed(p_recipient_user_id, v_channel, p_kind) THEN
      CONTINUE;
    END IF;

    SELECT * INTO v_tpl
    FROM public.notification_templates
    WHERE slug = p_kind AND channel = v_channel AND is_active = TRUE
    LIMIT 1;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    v_subject := public.render_notification_template(v_tpl.subject_template, p_variables);
    v_body := public.render_notification_template(v_tpl.body_template, p_variables);

    INSERT INTO public.notification_queue (
      notification_event_id, template_id, channel, status,
      recipient_user_id, recipient_email, recipient_phone,
      rendered_subject, rendered_body
    ) VALUES (
      v_ne_id, v_tpl.id, v_channel, 'queued',
      p_recipient_user_id, p_recipient_email, p_recipient_phone,
      v_subject, v_body
    )
    RETURNING id INTO v_queue_id;

    INSERT INTO public.notification_deliveries (queue_id, channel, status)
    VALUES (v_queue_id, v_channel, 'queued')
    RETURNING id INTO v_delivery_id;

    INSERT INTO public.notification_logs (
      notification_event_id, queue_id, delivery_id,
      actor_user_id, recipient_user_id, event_id,
      kind, channel, template_slug, status, message, metadata
    ) VALUES (
      v_ne_id, v_queue_id, v_delivery_id,
      p_actor_user_id, p_recipient_user_id, p_event_id,
      p_kind, v_channel, v_tpl.slug, 'queued', 'Enqueued',
      jsonb_build_object('entity_type', p_entity_type, 'entity_id', p_entity_id)
    );

    IF v_channel = 'in_app' AND p_recipient_user_id IS NOT NULL THEN
      v_title := COALESCE(v_subject, initcap(replace(p_kind, '_', ' ')));
      INSERT INTO public.notifications (user_id, type, title, body, payload)
      VALUES (
        p_recipient_user_id,
        p_kind,
        v_title,
        v_body,
        jsonb_build_object(
          'notificationEventId', v_ne_id,
          'eventId', p_event_id,
          'category', p_category
        )
      );
    END IF;
  END LOOP;

  RETURN v_ne_id;
END;
$$;

-- Distribution INVITER (backend)
CREATE OR REPLACE FUNCTION public.enqueue_inviter_distributions(
  p_event_id UUID,
  p_invitation_ids UUID[],
  p_channels public.distribution_channel[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.invitations%ROWTYPE;
  v_event public.events%ROWTYPE;
  v_ch public.distribution_channel;
  v_inv_id UUID;
  v_notif_ch public.notification_channel[];
  v_count INTEGER := 0;
  v_vars JSONB;
  v_link TEXT;
BEGIN
  IF NOT public.is_event_organizer(p_event_id) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'event_not_found'; END IF;

  v_notif_ch := ARRAY[]::public.notification_channel[];
  FOREACH v_ch IN ARRAY p_channels
  LOOP
    v_notif_ch := v_notif_ch || CASE v_ch
      WHEN 'email' THEN ARRAY['email']::public.notification_channel[]
      WHEN 'whatsapp' THEN ARRAY['whatsapp']::public.notification_channel[]
      ELSE ARRAY[]::public.notification_channel[]
    END;
  END LOOP;

  FOREACH v_inv_id IN ARRAY p_invitation_ids
  LOOP
    SELECT * INTO v_inv FROM public.invitations WHERE id = v_inv_id AND event_id = p_event_id;
    IF NOT FOUND THEN CONTINUE; END IF;

    v_link := COALESCE(
      v_inv.qr_payload,
      '/invite/' || v_inv.token
    );

    UPDATE public.invitations
    SET
      status = CASE
        WHEN status = 'created'::public.invitation_status THEN 'distributed'::public.invitation_status
        ELSE status
      END,
      distributed_at = COALESCE(distributed_at, NOW()),
      distribution_channels = (
        SELECT ARRAY(
          SELECT DISTINCT unnest(COALESCE(distribution_channels, '{}') || p_channels)
        )
      )
    WHERE id = v_inv.id;

    FOREACH v_ch IN ARRAY p_channels
    LOOP
      INSERT INTO public.invitation_distributions (invitation_id, channel, metadata)
      VALUES (v_inv.id, v_ch, jsonb_build_object('source', 'enqueue_inviter_distributions'));
    END LOOP;

    v_vars := jsonb_build_object(
      'event_name', v_event.title,
      'holder_name', trim(COALESCE(v_inv.guest_first_name, '') || ' ' || COALESCE(v_inv.guest_last_name, '')),
      'access_code', v_inv.unique_code,
      'secure_link', v_link,
      'ticket_type', v_inv.access_type_code
    );

    PERFORM public.emit_notification_event(
      'invitation_sent',
      'inviter',
      p_event_id,
      auth.uid(),
      v_inv.user_id,
      v_inv.guest_email,
      v_inv.guest_phone,
      'invitation',
      v_inv.id,
      v_vars,
      v_notif_ch
    );

    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('queued', v_count, 'channels', p_channels);
END;
$$;

-- Distribution billet + notification
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

-- Traitement file (Edge Function / cron — service_role)
CREATE OR REPLACE FUNCTION public.process_notification_queue_batch(p_limit INTEGER DEFAULT 25)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.notification_queue%ROWTYPE;
  v_delivery public.notification_deliveries%ROWTYPE;
  v_processed INTEGER := 0;
  v_failed INTEGER := 0;
  v_provider TEXT := COALESCE(current_setting('app.notification_provider', TRUE), 'invora_sim');
  v_backoff INTERVAL;
BEGIN
  FOR v_row IN
    SELECT * FROM public.notification_queue
    WHERE status IN ('pending', 'queued', 'failed')
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

    SELECT * INTO v_delivery FROM public.notification_deliveries WHERE queue_id = v_row.id LIMIT 1;

    BEGIN
      UPDATE public.notification_deliveries
      SET
        status = 'sent',
        provider = v_provider,
        provider_message_id = 'sim-' || v_row.id::TEXT,
        sent_at = NOW(),
        delivered_at = NOW()
      WHERE id = v_delivery.id;

      UPDATE public.notification_queue
      SET status = 'delivered', processed_at = NOW(), last_error = NULL
      WHERE id = v_row.id;

      INSERT INTO public.notification_logs (
        notification_event_id, queue_id, delivery_id,
        recipient_user_id, event_id, kind, channel, template_slug,
        status, provider, message
      )
      SELECT
        v_row.notification_event_id, v_row.id, v_delivery.id,
        v_row.recipient_user_id, ne.event_id, ne.kind, v_row.channel, t.slug,
        'delivered', v_provider, 'Sent via batch processor'
      FROM public.notification_events ne
      LEFT JOIN public.notification_templates t ON t.id = v_row.template_id
      WHERE ne.id = v_row.notification_event_id;

      v_processed := v_processed + 1;
    EXCEPTION WHEN OTHERS THEN
      v_backoff := (INTERVAL '1 minute' * power(2, LEAST(v_row.attempt_count, 6)));
      UPDATE public.notification_queue
      SET
        status = 'failed',
        last_error = SQLERRM,
        next_retry_at = NOW() + v_backoff
      WHERE id = v_row.id;

      UPDATE public.notification_deliveries
      SET status = 'failed', failed_at = NOW(), error_message = SQLERRM
      WHERE id = v_delivery.id;

      INSERT INTO public.notification_logs (
        notification_event_id, queue_id, delivery_id,
        recipient_user_id, kind, channel, status, provider, message, metadata
      )
      SELECT
        v_row.notification_event_id, v_row.id, v_delivery.id,
        v_row.recipient_user_id, ne.kind, v_row.channel, 'failed', v_provider,
        SQLERRM, jsonb_build_object('attempt', v_row.attempt_count)
      FROM public.notification_events ne WHERE ne.id = v_row.notification_event_id;

      v_failed := v_failed + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object('processed', v_processed, 'failed', v_failed);
END;
$$;

-- Préférences
CREATE OR REPLACE FUNCTION public.get_notification_preferences()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_prefs public.notification_preferences%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  SELECT * INTO v_prefs FROM public.notification_preferences WHERE user_id = v_uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'emailEnabled', TRUE,
      'whatsappEnabled', TRUE,
      'inAppEnabled', TRUE,
      'pushEnabled', FALSE,
      'smsEnabled', FALSE,
      'disabledKinds', '[]'::JSONB
    );
  END IF;
  RETURN jsonb_build_object(
    'emailEnabled', v_prefs.email_enabled,
    'whatsappEnabled', v_prefs.whatsapp_enabled,
    'inAppEnabled', v_prefs.in_app_enabled,
    'pushEnabled', v_prefs.push_enabled,
    'smsEnabled', v_prefs.sms_enabled,
    'disabledKinds', to_jsonb(v_prefs.disabled_kinds)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_notification_preferences(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  INSERT INTO public.notification_preferences (
    user_id, email_enabled, whatsapp_enabled, in_app_enabled, push_enabled, sms_enabled, disabled_kinds
  ) VALUES (
    v_uid,
    COALESCE((p_payload->>'emailEnabled')::BOOLEAN, TRUE),
    COALESCE((p_payload->>'whatsappEnabled')::BOOLEAN, TRUE),
    COALESCE((p_payload->>'inAppEnabled')::BOOLEAN, TRUE),
    COALESCE((p_payload->>'pushEnabled')::BOOLEAN, FALSE),
    COALESCE((p_payload->>'smsEnabled')::BOOLEAN, FALSE),
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(p_payload->'disabledKinds')),
      '{}'::TEXT[]
    )
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email_enabled = EXCLUDED.email_enabled,
    whatsapp_enabled = EXCLUDED.whatsapp_enabled,
    in_app_enabled = EXCLUDED.in_app_enabled,
    push_enabled = EXCLUDED.push_enabled,
    sms_enabled = EXCLUDED.sms_enabled,
    disabled_kinds = EXCLUDED.disabled_kinds,
    updated_at = NOW();

  RETURN public.get_notification_preferences();
END;
$$;

-- Analytics par canal
CREATE OR REPLACE FUNCTION public.get_notification_analytics(
  p_event_id UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_since TIMESTAMPTZ := NOW() - (GREATEST(p_days, 1) || ' days')::INTERVAL;
BEGIN
  IF p_event_id IS NOT NULL AND NOT (
    public.is_event_organizer(p_event_id) OR auth.uid() IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN jsonb_build_object(
    'sent', (
      SELECT COUNT(*) FROM public.notification_deliveries d
      JOIN public.notification_queue q ON q.id = d.queue_id
      JOIN public.notification_events ne ON ne.id = q.notification_event_id
      WHERE d.sent_at >= v_since
        AND (p_event_id IS NULL OR ne.event_id = p_event_id)
    ),
    'delivered', (
      SELECT COUNT(*) FROM public.notification_deliveries d
      JOIN public.notification_queue q ON q.id = d.queue_id
      JOIN public.notification_events ne ON ne.id = q.notification_event_id
      WHERE d.delivered_at >= v_since
        AND (p_event_id IS NULL OR ne.event_id = p_event_id)
    ),
    'opened', (
      SELECT COUNT(*) FROM public.notification_deliveries d
      JOIN public.notification_queue q ON q.id = d.queue_id
      JOIN public.notification_events ne ON ne.id = q.notification_event_id
      WHERE d.opened_at >= v_since
        AND (p_event_id IS NULL OR ne.event_id = p_event_id)
    ),
    'clicked', (
      SELECT COUNT(*) FROM public.notification_deliveries d
      JOIN public.notification_queue q ON q.id = d.queue_id
      JOIN public.notification_events ne ON ne.id = q.notification_event_id
      WHERE d.clicked_at >= v_since
        AND (p_event_id IS NULL OR ne.event_id = p_event_id)
    ),
    'failed', (
      SELECT COUNT(*) FROM public.notification_deliveries d
      JOIN public.notification_queue q ON q.id = d.queue_id
      JOIN public.notification_events ne ON ne.id = q.notification_event_id
      WHERE d.status = 'failed'
        AND d.created_at >= v_since
        AND (p_event_id IS NULL OR ne.event_id = p_event_id)
    ),
    'byChannel', (
      SELECT COALESCE(jsonb_object_agg(ch.channel::TEXT, ch.cnt), '{}'::JSONB)
      FROM (
        SELECT d.channel, COUNT(*)::INTEGER AS cnt
        FROM public.notification_deliveries d
        JOIN public.notification_queue q ON q.id = d.queue_id
        JOIN public.notification_events ne ON ne.id = q.notification_event_id
        WHERE d.sent_at >= v_since
          AND (p_event_id IS NULL OR ne.event_id = p_event_id)
        GROUP BY d.channel
      ) ch
    )
  );
END;
$$;

-- Marquer ouverture / clic (webhook provider — service_role)
CREATE OR REPLACE FUNCTION public.record_notification_delivery_event(
  p_delivery_id UUID,
  p_event TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_event = 'opened' THEN
    UPDATE public.notification_deliveries SET opened_at = NOW(), status = 'opened' WHERE id = p_delivery_id;
  ELSIF p_event = 'clicked' THEN
    UPDATE public.notification_deliveries SET clicked_at = NOW(), status = 'clicked' WHERE id = p_delivery_id;
  END IF;
END;
$$;

-- ─── Templates seed ───
INSERT INTO public.notification_templates (slug, channel, category, subject_template, body_template) VALUES
  ('invitation_sent', 'email', 'inviter', 'Invitation · {{event_name}}', 'Bonjour {{holder_name}}, votre accès {{ticket_type}} pour {{event_name}}. Code : {{access_code}}. Lien : {{secure_link}}'),
  ('invitation_sent', 'whatsapp', 'inviter', NULL, 'INVORA · {{event_name}}\n{{holder_name}} — {{ticket_type}}\nCode {{access_code}}\n{{secure_link}}'),
  ('invitation_sent', 'in_app', 'inviter', 'Invitation envoyée', '{{event_name}} — accès {{ticket_type}} distribué.'),
  ('invitation_opened', 'in_app', 'inviter', 'Invitation ouverte', '{{holder_name}} a ouvert l''invitation {{event_name}}.'),
  ('invitation_claimed', 'in_app', 'inviter', 'Invitation réclamée', '{{holder_name}} a réclamé son accès {{event_name}}.'),
  ('access_used', 'in_app', 'inviter', 'Accès utilisé', '{{holder_name}} — entrée validée à {{scan_time}} · {{event_name}}.'),
  ('event_reminder', 'email', 'inviter', 'Rappel · {{event_name}}', 'Rappel : {{event_name}} approche. Votre code {{access_code}}.'),
  ('event_reminder', 'whatsapp', 'inviter', NULL, 'Rappel INVORA · {{event_name}} · {{access_code}}'),
  ('ticket_distributed', 'email', 'vendre', 'Votre billet · {{event_name}}', 'Billet {{ticket_type}} pour {{event_name}}. Montant {{amount}}. Code {{access_code}}. {{secure_link}}'),
  ('ticket_distributed', 'whatsapp', 'vendre', NULL, 'Billet INVORA · {{event_name}}\n{{ticket_type}} · {{access_code}}\n{{secure_link}}'),
  ('ticket_distributed', 'in_app', 'vendre', 'Billet distribué', '{{event_name}} — {{ticket_type}} envoyé.'),
  ('payment_confirmed', 'in_app', 'vendre', 'Paiement confirmé', '{{event_name}} — {{amount}} FCFA confirmés.'),
  ('payment_confirmed', 'email', 'vendre', 'Confirmation paiement', 'Paiement confirmé pour {{event_name}}. Montant {{amount}}.'),
  ('ticket_generated', 'in_app', 'vendre', 'Billet généré', 'Billet {{ticket_type}} prêt pour {{event_name}}.'),
  ('purchase_confirmed', 'in_app', 'vendre', 'Achat confirmé', 'Achat billet {{ticket_type}} · {{event_name}}.'),
  ('ticket_used', 'in_app', 'vendre', 'Billet utilisé', 'Entrée validée · {{event_name}} · {{scan_time}}.'),
  ('campaign_new', 'in_app', 'partner', 'Nouvelle campagne', 'Campagne disponible · {{event_name}}.'),
  ('conversion_new', 'in_app', 'partner', 'Nouvelle conversion', 'Conversion enregistrée · {{event_name}} · {{commission}} FCFA.'),
  ('commission_earned', 'in_app', 'partner', 'Commission', '+{{commission}} FCFA · {{event_name}}.'),
  ('withdrawal_approved', 'in_app', 'partner', 'Retrait validé', 'Retrait {{amount}} FCFA approuvé.'),
  ('withdrawal_rejected', 'in_app', 'partner', 'Retrait refusé', 'Retrait {{amount}} FCFA refusé. {{reason}}'),
  ('goal_reached', 'in_app', 'partner', 'Objectif atteint', 'Objectif partenaire atteint · {{event_name}}.'),
  ('event_published', 'in_app', 'organizer', 'Événement publié', '{{event_name}} est en ligne.'),
  ('payment_received', 'in_app', 'organizer', 'Paiement reçu', '+{{amount}} FCFA · {{event_name}}.'),
  ('sale_new', 'in_app', 'organizer', 'Nouvelle vente', 'Billet {{ticket_type}} vendu · {{event_name}}.'),
  ('invitation_claimed_org', 'in_app', 'organizer', 'Invitation réclamée', '{{holder_name}} a réclamé · {{event_name}}.'),
  ('partner_commission', 'in_app', 'organizer', 'Commission partenaire', 'Commission partenaire · {{commission}} FCFA.'),
  ('withdrawal_processed', 'in_app', 'organizer', 'Retrait traité', 'Retrait partenaire traité · {{amount}} FCFA.'),
  ('event_ended', 'in_app', 'organizer', 'Fin événement', '{{event_name}} terminé.'),
  ('scanner_online', 'in_app', 'scanner', 'Scanner connecté', 'Session scanner active · {{event_name}}.'),
  ('scanner_offline', 'in_app', 'scanner', 'Scanner hors ligne', 'Mode hors ligne · {{event_name}}.'),
  ('offline_sync_done', 'in_app', 'scanner', 'Sync terminée', '{{synced}} scans synchronisés.'),
  ('security_incident', 'in_app', 'scanner', 'Alerte sécurité', '{{message}} · {{event_name}}.'),
  ('publication_live', 'in_app', 'rayonner', 'Publication', '{{event_name}} — contenu disponible.'),
  ('story_live', 'in_app', 'rayonner', 'Story', 'Story disponible · {{event_name}}.'),
  ('media_kit_ready', 'in_app', 'rayonner', 'Media kit', 'Media kit prêt · {{event_name}}.'),
  ('presence_milestone', 'in_app', 'rayonner', 'Présence', 'Taux présence {{presence_rate}}% · {{event_name}}.'),
  ('field_alert', 'in_app', 'rayonner', 'Alerte terrain', '{{message}}'),
  ('results_ready', 'in_app', 'rayonner', 'Résultats', 'Résultats disponibles · {{event_name}}.'),
  ('album_ready', 'in_app', 'rayonner', 'Album', 'Album photos · {{event_name}}.'),
  ('recap_ready', 'in_app', 'rayonner', 'Bilan', 'Bilan disponible · {{event_name}}.'),
  ('thank_you', 'email', 'rayonner', 'Merci · {{event_name}}', 'Merci d''avoir participé à {{event_name}}, {{holder_name}}.')
ON CONFLICT (slug, channel) DO NOTHING;

-- ─── Hooks métier ───

CREATE OR REPLACE FUNCTION public.mark_invitation_opened(p_token TEXT)
RETURNS public.invitation_status
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status public.invitation_status;
  v_inv public.invitations%ROWTYPE;
  v_event public.events%ROWTYPE;
BEGIN
  UPDATE public.invitations
  SET
    opened_at = COALESCE(opened_at, NOW()),
    status = CASE
      WHEN status = 'distributed'::public.invitation_status THEN 'opened'::public.invitation_status
      ELSE status
    END
  WHERE token = p_token
  RETURNING * INTO v_inv;

  IF FOUND THEN
    v_status := v_inv.status;
    SELECT * INTO v_event FROM public.events WHERE id = v_inv.event_id;
    PERFORM public.emit_notification_event(
      'invitation_opened',
      'inviter',
      v_inv.event_id,
      NULL,
      (SELECT organizer_id FROM public.events WHERE id = v_inv.event_id),
      NULL,
      NULL,
      'invitation',
      v_inv.id,
      jsonb_build_object(
        'event_name', v_event.title,
        'holder_name', trim(COALESCE(v_inv.guest_first_name, '') || ' ' || COALESCE(v_inv.guest_last_name, ''))
      ),
      ARRAY['in_app']::public.notification_channel[]
    );
  END IF;

  RETURN v_status;
END;
$$;

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
  v_event public.events%ROWTYPE;
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

  SELECT * INTO v_event FROM public.events WHERE id = v_inv.event_id;

  PERFORM public.emit_notification_event(
    'invitation_claimed',
    'inviter',
    v_inv.event_id,
    p_user_id,
    p_user_id,
    v_inv.guest_email,
    v_inv.guest_phone,
    'invitation',
    v_inv.id,
    jsonb_build_object(
      'event_name', v_event.title,
      'holder_name', trim(COALESCE(v_inv.guest_first_name, '') || ' ' || COALESCE(v_inv.guest_last_name, ''))
    ),
    ARRAY['in_app', 'email']::public.notification_channel[]
  );

  PERFORM public.emit_notification_event(
    'invitation_claimed_org',
    'organizer',
    v_inv.event_id,
    p_user_id,
    (SELECT organizer_id FROM public.events WHERE id = v_inv.event_id),
    NULL,
    NULL,
    'invitation',
    v_inv.id,
    jsonb_build_object(
      'event_name', v_event.title,
      'holder_name', trim(COALESCE(v_inv.guest_first_name, '') || ' ' || COALESCE(v_inv.guest_last_name, ''))
    ),
    ARRAY['in_app']::public.notification_channel[]
  );

  RETURN v_inv.id;
END;
$$;

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
  v_result JSONB;
BEGIN
  v_result := public.enqueue_ticket_distribution(p_access_token, p_channel, p_user_id);
  RETURN (v_result->>'logId')::UUID;
END;
$$;

-- Scan validé → accès utilisé
CREATE OR REPLACE FUNCTION public.trg_notify_access_used()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.events%ROWTYPE;
  v_name TEXT;
  v_kind TEXT;
BEGIN
  IF NEW.result <> 'valid' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_event FROM public.events WHERE id = NEW.event_id;
  v_name := trim(COALESCE(NEW.guest_first_name, '') || ' ' || COALESCE(NEW.guest_last_name, ''));
  v_kind := CASE WHEN NEW.pass_kind = 'ticket' THEN 'ticket_used' ELSE 'access_used' END;

  PERFORM public.emit_notification_event(
    v_kind,
    CASE WHEN NEW.pass_kind = 'ticket' THEN 'vendre'::public.notification_category ELSE 'inviter'::public.notification_category END,
    NEW.event_id,
    NEW.scanner_id,
    NULL,
    NULL,
    NULL,
    NEW.pass_kind,
    NEW.access_id,
    jsonb_build_object(
      'event_name', v_event.title,
      'holder_name', v_name,
      'scan_time', to_char(NEW.scanned_at, 'HH24:MI'),
      'gate', NEW.gate_code::TEXT
    ),
    ARRAY['in_app']::public.notification_channel[]
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_scans_notify_access_used ON public.scans;
CREATE TRIGGER trg_scans_notify_access_used
  AFTER INSERT ON public.scans
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_access_used();

-- Alerte scanner → notification
CREATE OR REPLACE FUNCTION public.trg_notify_scanner_security()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.events%ROWTYPE;
BEGIN
  SELECT * INTO v_event FROM public.events WHERE id = NEW.event_id;
  PERFORM public.emit_notification_event(
    'security_incident',
    'scanner',
    NEW.event_id,
    NEW.scanner_id,
    NULL,
    NULL,
    NULL,
    'security',
    NEW.id,
    jsonb_build_object('event_name', v_event.title, 'message', NEW.message),
    ARRAY['in_app']::public.notification_channel[]
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_scanner_security_notify ON public.scanner_security_events;
CREATE TRIGGER trg_scanner_security_notify
  AFTER INSERT ON public.scanner_security_events
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_scanner_security();

-- Paiement confirmé
CREATE OR REPLACE FUNCTION public.trg_notify_payment_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.events%ROWTYPE;
BEGIN
  IF NEW.payment_status IS DISTINCT FROM 'paid'::public.payment_status
     OR OLD.payment_status IS NOT DISTINCT FROM 'paid'::public.payment_status THEN
    RETURN NEW;
  END IF;

  SELECT e.* INTO v_event
  FROM public.events e
  WHERE e.id = NEW.event_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  PERFORM public.emit_notification_event(
    'payment_confirmed',
    'vendre',
    v_event.id,
    NULL,
    NEW.user_id,
    NULL,
    NULL,
    'transaction',
    NEW.id,
    jsonb_build_object(
      'event_name', v_event.title,
      'amount', COALESCE(NEW.gross_fcfa, NEW.amount_cents)
    ),
    ARRAY['in_app', 'email']::public.notification_channel[]
  );

  PERFORM public.emit_notification_event(
    'payment_received',
    'organizer',
    v_event.id,
    NULL,
    v_event.organizer_id,
    NULL,
    NULL,
    'transaction',
    NEW.id,
    jsonb_build_object(
      'event_name', v_event.title,
      'amount', COALESCE(NEW.gross_fcfa, NEW.amount_cents)
    ),
    ARRAY['in_app']::public.notification_channel[]
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_transactions_payment_notify ON public.transactions;
CREATE TRIGGER trg_transactions_payment_notify
  AFTER UPDATE OF payment_status ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_notify_payment_confirmed();

-- Partenaire : conversion + commission
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
  v_event public.events%ROWTYPE;
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

  SELECT * INTO v_event FROM public.events WHERE id = v_campaign.event_id;

  PERFORM public.emit_notification_event(
    'conversion_new',
    'partner',
    v_campaign.event_id,
    NULL,
    (SELECT user_id FROM public.partners WHERE id = v_campaign.partner_id),
    NULL,
    NULL,
    'commission_ledger',
    v_ledger_id,
    jsonb_build_object('event_name', v_event.title, 'commission', v_commission),
    ARRAY['in_app']::public.notification_channel[]
  );

  PERFORM public.emit_notification_event(
    'commission_earned',
    'partner',
    v_campaign.event_id,
    NULL,
    (SELECT user_id FROM public.partners WHERE id = v_campaign.partner_id),
    NULL,
    NULL,
    'commission_ledger',
    v_ledger_id,
    jsonb_build_object('event_name', v_event.title, 'commission', v_commission),
    ARRAY['in_app']::public.notification_channel[]
  );

  RETURN v_ledger_id;
END;
$$;

-- RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notification_templates_read" ON public.notification_templates
  FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "notification_prefs_own" ON public.notification_preferences
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "notification_events_organizer" ON public.notification_events
  FOR SELECT USING (
    event_id IS NULL
    OR public.is_event_organizer(event_id)
    OR recipient_user_id = auth.uid()
  );

CREATE POLICY "notification_logs_organizer" ON public.notification_logs
  FOR SELECT USING (
    event_id IS NULL
    OR public.is_event_organizer(event_id)
    OR recipient_user_id = auth.uid()
  );

CREATE POLICY "notification_queue_organizer" ON public.notification_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.notification_events ne
      WHERE ne.id = notification_event_id
        AND (public.is_event_organizer(ne.event_id) OR ne.recipient_user_id = auth.uid())
    )
  );

CREATE POLICY "notification_deliveries_organizer" ON public.notification_deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.notification_queue q
      JOIN public.notification_events ne ON ne.id = q.notification_event_id
      WHERE q.id = queue_id
        AND (public.is_event_organizer(ne.event_id) OR ne.recipient_user_id = auth.uid())
    )
  );

GRANT EXECUTE ON FUNCTION public.enqueue_inviter_distributions(UUID, UUID[], public.distribution_channel[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_ticket_distribution(TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_notification_preferences() TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_notification_preferences(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_notification_analytics(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_notification_queue_batch(INTEGER) TO service_role;
