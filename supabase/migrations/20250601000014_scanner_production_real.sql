-- PHASE 11E — Scanner Production Real

CREATE TYPE public.scanner_display_status AS ENUM (
  'VALID',
  'USED',
  'EXPIRED',
  'CANCELLED',
  'REFUNDED',
  'BLOCKED',
  'UNKNOWN'
);

-- Sessions terrain actives
CREATE TABLE IF NOT EXISTS public.scan_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  scanner_user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  gate_code public.scanner_gate_code NOT NULL DEFAULT 'main',
  device_id TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_scan_sessions_active ON public.scan_sessions (event_id, scanner_user_id)
  WHERE is_active = TRUE;

-- Appareils scanner (optionnel)
CREATE TABLE IF NOT EXISTS public.scan_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL UNIQUE,
  label TEXT,
  scanner_user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- Vues alias (spec)
CREATE OR REPLACE VIEW public.scan_logs AS
SELECT
  s.id AS scan_id,
  s.event_id,
  s.access_id,
  s.scanner_id AS scanner_user_id,
  s.device_id,
  s.gate_code AS gate,
  s.result AS status,
  s.scanned_at AS timestamp,
  s.pass_kind,
  s.denial_reason,
  s.guest_first_name,
  s.guest_last_name,
  s.access_type_label,
  s.pass_reference,
  s.metadata
FROM public.scans s;

CREATE OR REPLACE VIEW public.scan_events AS
SELECT
  sal.id,
  sal.event_id,
  sal.access_id,
  sal.scanner_id,
  sal.validation_status,
  sal.denial_reason,
  sal.gate_code,
  sal.created_at
FROM public.scanner_audit_log sal;

-- Alertes / sécurité
CREATE TABLE IF NOT EXISTS public.scanner_security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  scanner_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  scan_id UUID REFERENCES public.scans (id) ON DELETE SET NULL,
  alert_kind TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scanner_security_event ON public.scanner_security_events (event_id, created_at DESC);

-- Portes par défaut pour chaque événement
CREATE OR REPLACE FUNCTION public.ensure_event_scanner_gates(p_event_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  INSERT INTO public.scanner_gates (event_id, code, label) VALUES
    (p_event_id, 'main', 'Entrée principale'),
    (p_event_id, 'vip', 'VIP Gate'),
    (p_event_id, 'backstage', 'Backstage'),
    (p_event_id, 'corporate', 'Corporate'),
    (p_event_id, 'staff', 'Staff'),
    (p_event_id, 'press', 'Presse')
  ON CONFLICT (event_id, code) DO NOTHING;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_scanner_security_event(
  p_event_id UUID,
  p_alert_kind TEXT,
  p_message TEXT,
  p_scanner_id UUID DEFAULT auth.uid(),
  p_scan_id UUID DEFAULT NULL,
  p_severity TEXT DEFAULT 'warning',
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
  INSERT INTO public.scanner_security_events (
    event_id, scanner_id, scan_id, alert_kind, severity, message, metadata
  ) VALUES (
    p_event_id, p_scanner_id, p_scan_id, p_alert_kind, p_severity, p_message, p_metadata
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Contexte session scanner
CREATE OR REPLACE FUNCTION public.get_scanner_session_context(p_event_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_event public.events%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_team_role public.scanner_team_role;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;

  IF p_event_id IS NOT NULL THEN
    SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
  ELSE
    SELECT e.* INTO v_event
    FROM public.events e
    WHERE e.status IN ('published', 'live')
      AND (
        e.organizer_id = v_uid
        OR public.has_event_role(e.id, ARRAY['scanner', 'staff', 'organizer', 'owner'])
      )
    ORDER BY e.starts_at NULLS LAST
    LIMIT 1;
  END IF;

  IF NOT FOUND THEN RAISE EXCEPTION 'no_scanner_event'; END IF;

  IF NOT public.has_event_role(v_event.id, ARRAY['scanner', 'staff', 'organizer', 'owner']) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  PERFORM public.ensure_event_scanner_gates(v_event.id);

  SELECT team_role INTO v_team_role FROM public.scanner_team_members
  WHERE event_id = v_event.id AND user_id = v_uid LIMIT 1;

  RETURN jsonb_build_object(
    'eventId', v_event.id,
    'eventTitle', v_event.title,
    'gateCode', 'main',
    'agentName', COALESCE(v_profile.full_name, 'Agent scanner'),
    'teamRole', COALESCE(v_team_role::TEXT, 'scanner_agent')
  );
END;
$$;

-- Validation enrichie (statuts explicites)
CREATE OR REPLACE FUNCTION public.validate_access_scan(
  p_event_id UUID,
  p_pass_reference TEXT,
  p_gate_code public.scanner_gate_code DEFAULT 'main',
  p_device_id TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_scanner_id UUID := auth.uid();
  v_pass RECORD;
  v_event public.events%ROWTYPE;
  v_result public.scan_result;
  v_denial public.scanner_denial_reason;
  v_status TEXT;
  v_display public.scanner_display_status;
  v_scan_id UUID;
  v_audit_id UUID;
  v_gate_label TEXT;
  v_started TIMESTAMPTZ := clock_timestamp();
BEGIN
  IF v_scanner_id IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  IF NOT public.has_event_role(p_event_id, ARRAY['scanner', 'staff', 'organizer', 'owner']) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;

  SELECT label INTO v_gate_label FROM public.scanner_gates
  WHERE event_id = p_event_id AND code = p_gate_code;

  SELECT * INTO v_pass FROM public.resolve_scan_pass(p_event_id, p_pass_reference);

  IF NOT FOUND THEN
    v_result := 'invalid';
    v_denial := 'invalid_qr';
    v_status := 'denied';
    v_display := 'UNKNOWN';
  ELSIF v_event.ends_at IS NOT NULL AND v_event.ends_at < NOW() THEN
    v_result := 'expired';
    v_denial := 'event_ended';
    v_status := 'denied';
    v_display := 'EXPIRED';
  ELSIF v_pass.pass_kind = 'ticket' AND v_pass.access_status = 'refunded' THEN
    v_result := 'invalid';
    v_denial := 'cancelled';
    v_status := 'denied';
    v_display := 'REFUNDED';
  ELSIF v_pass.is_suspended THEN
    v_result := 'invalid';
    v_denial := 'suspended';
    v_status := 'denied';
    v_display := 'BLOCKED';
  ELSIF v_pass.access_status IN ('cancelled', 'failed') THEN
    v_result := 'invalid';
    v_denial := 'cancelled';
    v_status := 'denied';
    v_display := 'CANCELLED';
  ELSIF v_pass.access_status IN ('expired') OR (v_pass.expires_at IS NOT NULL AND v_pass.expires_at < NOW()) THEN
    v_result := 'expired';
    v_denial := 'expired';
    v_status := 'denied';
    v_display := 'EXPIRED';
  ELSIF v_pass.scanned_at IS NOT NULL OR v_pass.access_status = 'scanned' THEN
    v_result := 'duplicate';
    v_denial := 'already_used';
    v_status := 'denied';
    v_display := 'USED';
    PERFORM public.log_scanner_security_event(
      p_event_id, 'double_scan', 'Double scan détecté', v_scanner_id, NULL, 'warning',
      jsonb_build_object('access_id', v_pass.access_id, 'pass_reference', p_pass_reference)
    );
  ELSE
    v_result := 'valid';
    v_denial := NULL;
    v_status := 'validated';
    v_display := 'VALID';

    IF v_pass.pass_kind = 'invitation' THEN
      UPDATE public.invitations SET status = 'scanned', scanned_at = NOW() WHERE id = v_pass.access_id;
    ELSE
      UPDATE public.tickets SET scanned_at = NOW(), status = 'used' WHERE id = v_pass.access_id;
    END IF;
  END IF;

  INSERT INTO public.scans (
    event_id, scanner_id, pass_reference, result, access_id, pass_kind,
    gate_code, denial_reason, device_id, ip_address,
    guest_first_name, guest_last_name, access_type_label, metadata
  ) VALUES (
    p_event_id, v_scanner_id, trim(p_pass_reference), v_result, v_pass.access_id, v_pass.pass_kind,
    p_gate_code, v_denial, p_device_id, p_ip_address,
    v_pass.first_name, v_pass.last_name, v_pass.access_type_label,
    jsonb_build_object(
      'validation_status', v_status,
      'display_status', v_display,
      'gate_label', v_gate_label,
      'validation_ms', EXTRACT(MILLISECONDS FROM clock_timestamp() - v_started)::INTEGER
    )
  )
  RETURNING id INTO v_scan_id;

  INSERT INTO public.scanner_audit_log (
    event_id, access_id, scanner_id, scan_id, pass_reference,
    validation_status, denial_reason, gate_code, device_id, ip_address, metadata
  ) VALUES (
    p_event_id, v_pass.access_id, v_scanner_id, v_scan_id, trim(p_pass_reference),
    v_status, v_denial, p_gate_code, p_device_id, p_ip_address,
    jsonb_build_object('display_status', v_display)
  )
  RETURNING id INTO v_audit_id;

  RETURN jsonb_build_object(
    'scanId', v_scan_id,
    'auditId', v_audit_id,
    'result', v_result,
    'status', v_status,
    'displayStatus', v_display,
    'denialReason', v_denial,
    'firstName', COALESCE(v_pass.first_name, ''),
    'lastName', COALESCE(v_pass.last_name, ''),
    'accessTypeLabel', COALESCE(v_pass.access_type_label, '—'),
    'eventTitle', v_event.title,
    'gateCode', p_gate_code,
    'gateLabel', COALESCE(v_gate_label, p_gate_code::TEXT),
    'passKind', v_pass.pass_kind,
    'validationMs', EXTRACT(MILLISECONDS FROM clock_timestamp() - v_started)::INTEGER
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_scanner_history(
  p_event_id UUID,
  p_limit INTEGER DEFAULT 100
)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(row_to_json(h) ORDER BY h.at DESC), '[]'::JSONB)
  FROM (
    SELECT
      s.id,
      s.scanned_at AS at,
      s.gate_code AS "gateCode",
      COALESCE(pr.full_name, 'Agent') AS "agentName",
      CASE WHEN s.result = 'valid' THEN 'validated' ELSE 'denied' END AS status,
      s.denial_reason AS "denialReason",
      trim(COALESCE(s.guest_first_name, '') || ' ' || COALESCE(s.guest_last_name, '')) AS "guestName",
      COALESCE(s.access_type_label, '—') AS "accessTypeLabel",
      s.pass_reference AS "passReference",
      s.metadata->>'display_status' AS "displayStatus"
    FROM public.scans s
    LEFT JOIN public.profiles pr ON pr.id = s.scanner_id
    WHERE s.event_id = p_event_id
      AND public.has_event_role(p_event_id, ARRAY['scanner', 'staff', 'organizer', 'owner'])
    ORDER BY s.scanned_at DESC
    LIMIT p_limit
  ) h;
$$;

CREATE OR REPLACE FUNCTION public.get_scanner_field_analytics(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_validated INTEGER;
  v_denied INTEGER;
  v_avg_ms NUMERIC;
  v_top_gate public.scanner_gate_code;
  v_by_gate JSONB;
  v_peak_hour TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_event_role(p_event_id, ARRAY['scanner', 'staff', 'organizer', 'owner']) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_validated FROM public.scans
  WHERE event_id = p_event_id AND result = 'valid';

  SELECT COUNT(*)::INTEGER INTO v_denied FROM public.scans
  WHERE event_id = p_event_id AND result <> 'valid';

  SELECT COALESCE(AVG((metadata->>'validation_ms')::NUMERIC), 450) INTO v_avg_ms
  FROM public.scans WHERE event_id = p_event_id;

  SELECT gate_code INTO v_top_gate FROM public.scans
  WHERE event_id = p_event_id AND result = 'valid'
  GROUP BY gate_code ORDER BY COUNT(*) DESC LIMIT 1;

  SELECT COALESCE(jsonb_object_agg(gate_code, cnt), '{}'::JSONB) INTO v_by_gate
  FROM (
    SELECT gate_code::TEXT, COUNT(*)::INTEGER AS cnt
    FROM public.scans WHERE event_id = p_event_id AND result = 'valid'
    GROUP BY gate_code
  ) g;

  SELECT to_char(date_trunc('hour', scanned_at), 'HH24') || 'h' INTO v_peak_hour
  FROM public.scans
  WHERE event_id = p_event_id AND result = 'valid'
  GROUP BY date_trunc('hour', scanned_at)
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'validated', v_validated,
    'denied', v_denied,
    'avgValidationMs', COALESCE(v_avg_ms, 450),
    'topGate', v_top_gate,
    'peakHour', COALESCE(v_peak_hour, '—'),
    'scansByGate', v_by_gate
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_scanner_live_stats(p_event_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base JSONB;
  v_incidents INTEGER;
  v_recent JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_event_role(p_event_id, ARRAY['scanner', 'staff', 'organizer', 'owner']) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jsonb_build_object(
    'entered', (SELECT COUNT(*)::INTEGER FROM public.scans WHERE event_id = p_event_id AND result = 'valid'),
    'expected', (
      SELECT COALESCE(SUM(quantity), 0)::INTEGER FROM public.ticket_types WHERE event_id = p_event_id
    ) + (SELECT COUNT(*)::INTEGER FROM public.invitations WHERE event_id = p_event_id),
    'denied', (SELECT COUNT(*)::INTEGER FROM public.scans WHERE event_id = p_event_id AND result <> 'valid'),
    'presenceRate', (
      SELECT CASE WHEN denom > 0 THEN ROUND(100.0 * num / denom, 1) ELSE 0 END
      FROM (
        SELECT
          (SELECT COUNT(*) FROM public.scans WHERE event_id = p_event_id AND result = 'valid') AS num,
          GREATEST(1,
            (SELECT COUNT(*) FROM public.invitations WHERE event_id = p_event_id)
            + (SELECT COUNT(*) FROM public.tickets WHERE event_id = p_event_id AND payment_status = 'paid')
          ) AS denom
      ) s
    ),
    'avgValidationMs', (
      SELECT COALESCE(AVG((metadata->>'validation_ms')::INTEGER), 450)
      FROM public.scans WHERE event_id = p_event_id
    ),
    'topGate', (
      SELECT gate_code::TEXT FROM public.scans
      WHERE event_id = p_event_id AND result = 'valid'
      GROUP BY gate_code ORDER BY COUNT(*) DESC LIMIT 1
    )
  ) INTO v_base;

  SELECT COUNT(*)::INTEGER INTO v_incidents
  FROM public.scanner_security_events
  WHERE event_id = p_event_id AND created_at > NOW() - INTERVAL '24 hours';

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', s.id,
    'guestName', trim(COALESCE(s.guest_first_name, '') || ' ' || COALESCE(s.guest_last_name, '')),
    'status', CASE WHEN s.result = 'valid' THEN 'validated' ELSE 'denied' END,
    'at', s.scanned_at,
    'displayStatus', s.metadata->>'display_status'
  ) ORDER BY s.scanned_at DESC), '[]'::JSONB)
  INTO v_recent
  FROM (
    SELECT * FROM public.scans WHERE event_id = p_event_id ORDER BY scanned_at DESC LIMIT 8
  ) s;

  RETURN v_base || jsonb_build_object('recentIncidents', v_incidents, 'recentScans', v_recent);
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_scanner_offline_scan(
  p_event_id UUID,
  p_pass_reference TEXT,
  p_gate_code public.scanner_gate_code DEFAULT 'main',
  p_device_id TEXT DEFAULT NULL,
  p_payload JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;

  INSERT INTO public.scanner_offline_queue (
    event_id, scanner_id, pass_reference, gate_code, device_id, payload
  ) VALUES (
    p_event_id, auth.uid(), trim(p_pass_reference), p_gate_code, p_device_id, p_payload
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_scanner_offline_batch(p_limit INTEGER DEFAULT 20)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.scanner_offline_queue%ROWTYPE;
  v_synced INTEGER := 0;
  v_failed INTEGER := 0;
BEGIN
  FOR v_row IN
    SELECT * FROM public.scanner_offline_queue
    WHERE scanner_id = auth.uid() AND synced_at IS NULL
    ORDER BY queued_at
    LIMIT p_limit
  LOOP
    BEGIN
      PERFORM public.validate_access_scan(
        v_row.event_id, v_row.pass_reference, v_row.gate_code, v_row.device_id, NULL
      );
      UPDATE public.scanner_offline_queue SET synced_at = NOW(), sync_error = NULL WHERE id = v_row.id;
      v_synced := v_synced + 1;
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.scanner_offline_queue
      SET sync_error = SQLERRM WHERE id = v_row.id;
      v_failed := v_failed + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object('synced', v_synced, 'failed', v_failed);
END;
$$;

ALTER TABLE public.scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanner_security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scan_sessions_own" ON public.scan_sessions
  FOR ALL USING (scanner_user_id = auth.uid());

CREATE POLICY "scanner_security_select" ON public.scanner_security_events
  FOR SELECT USING (
    public.has_event_role(event_id, ARRAY['scanner', 'staff', 'organizer', 'owner'])
  );

GRANT EXECUTE ON FUNCTION public.ensure_event_scanner_gates(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_scanner_session_context(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_scanner_history(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_scanner_field_analytics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_scanner_offline_scan(UUID, TEXT, public.scanner_gate_code, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_scanner_offline_batch(INTEGER) TO authenticated;
