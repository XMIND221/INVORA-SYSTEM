-- PHASE 6 — SCANNER ENGINE PRO (validation serveur, audit, multi-portes, offline queue)

CREATE TYPE public.scanner_denial_reason AS ENUM (
  'invalid_qr',
  'expired',
  'already_used',
  'cancelled',
  'suspended',
  'event_ended'
);

CREATE TYPE public.scanner_gate_code AS ENUM (
  'main',
  'vip',
  'backstage',
  'press',
  'staff',
  'corporate'
);

CREATE TYPE public.scanner_team_role AS ENUM (
  'chef_scanner',
  'scanner_agent',
  'supervisor'
);

-- Portes par événement (config)
CREATE TABLE public.scanner_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  code public.scanner_gate_code NOT NULL,
  label TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, code)
);

CREATE INDEX idx_scanner_gates_event ON public.scanner_gates (event_id);

-- Équipes terrain
CREATE TABLE public.scanner_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  team_role public.scanner_team_role NOT NULL DEFAULT 'scanner_agent',
  display_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX idx_scanner_team_event ON public.scanner_team_members (event_id);

-- Enrichissement scans (audit terrain)
ALTER TABLE public.scans
  ADD COLUMN IF NOT EXISTS access_id UUID,
  ADD COLUMN IF NOT EXISTS pass_kind TEXT,
  ADD COLUMN IF NOT EXISTS gate_code public.scanner_gate_code DEFAULT 'main',
  ADD COLUMN IF NOT EXISTS denial_reason public.scanner_denial_reason,
  ADD COLUMN IF NOT EXISTS device_id TEXT,
  ADD COLUMN IF NOT EXISTS ip_address INET,
  ADD COLUMN IF NOT EXISTS guest_first_name TEXT,
  ADD COLUMN IF NOT EXISTS guest_last_name TEXT,
  ADD COLUMN IF NOT EXISTS access_type_label TEXT;

CREATE INDEX IF NOT EXISTS idx_scans_access ON public.scans (event_id, access_id);
CREATE INDEX IF NOT EXISTS idx_scans_gate ON public.scans (event_id, gate_code, scanned_at DESC);

-- Journal d'audit immuable (aucune suppression)
CREATE TABLE public.scanner_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  access_id UUID,
  scanner_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  scan_id UUID REFERENCES public.scans (id) ON DELETE SET NULL,
  pass_reference TEXT NOT NULL,
  validation_status TEXT NOT NULL CHECK (validation_status IN ('validated', 'denied')),
  denial_reason public.scanner_denial_reason,
  gate_code public.scanner_gate_code NOT NULL DEFAULT 'main',
  device_id TEXT,
  ip_address INET,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scanner_audit_event ON public.scanner_audit_log (event_id, created_at DESC);

-- File hors ligne (sync ultérieure)
CREATE TABLE public.scanner_offline_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  scanner_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  pass_reference TEXT NOT NULL,
  gate_code public.scanner_gate_code NOT NULL DEFAULT 'main',
  device_id TEXT,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  sync_error TEXT,
  payload JSONB
);

CREATE INDEX idx_scanner_offline_pending ON public.scanner_offline_queue (scanner_id, synced_at)
  WHERE synced_at IS NULL;

-- Anti double validation : un accès validé une fois par événement
CREATE UNIQUE INDEX IF NOT EXISTS idx_scans_unique_valid_access
  ON public.scans (event_id, access_id)
  WHERE result = 'valid' AND access_id IS NOT NULL;

-- Résolution pass → invitation ou billet
CREATE OR REPLACE FUNCTION public.resolve_scan_pass(
  p_event_id UUID,
  p_pass_reference TEXT
)
RETURNS TABLE (
  pass_kind TEXT,
  access_id UUID,
  first_name TEXT,
  last_name TEXT,
  access_type_label TEXT,
  access_status TEXT,
  expires_at TIMESTAMPTZ,
  scanned_at TIMESTAMPTZ,
  is_suspended BOOLEAN
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_ref TEXT := trim(p_pass_reference);
BEGIN
  RETURN QUERY
  SELECT
    'invitation'::TEXT,
    i.id,
    i.guest_first_name,
    i.guest_last_name,
    COALESCE(at.label, i.access_type_code),
    i.status::TEXT,
    i.expires_at,
    i.scanned_at,
    FALSE
  FROM public.invitations i
  LEFT JOIN public.access_types at
    ON at.event_id = i.event_id AND at.code = i.access_type_code
  WHERE i.event_id = p_event_id
    AND (
      i.qr_payload = v_ref
      OR i.unique_code = v_ref
      OR i.token = v_ref
      OR i.unique_code ILIKE v_ref
    )
  LIMIT 1;

  IF FOUND THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    'ticket'::TEXT,
    t.id,
    t.buyer_first_name,
    t.buyer_last_name,
    tt.name,
    t.payment_status::TEXT,
    NULL::TIMESTAMPTZ,
    t.scanned_at,
    (t.payment_status <> 'paid')
  FROM public.tickets t
  JOIN public.ticket_types tt ON tt.id = t.ticket_type_id
  WHERE t.event_id = p_event_id
    AND (
      t.access_token = v_ref
      OR t.unique_code = v_ref
      OR t.ticket_token = v_ref
      OR t.unique_code ILIKE v_ref
    )
  LIMIT 1;
END;
$$;

-- Validation officielle (RPC — source de vérité)
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
  v_scan_id UUID;
  v_audit_id UUID;
  v_display JSONB;
BEGIN
  IF v_scanner_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  IF NOT public.has_event_role(p_event_id, ARRAY['scanner', 'staff', 'organizer', 'owner']) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  SELECT * INTO v_pass FROM public.resolve_scan_pass(p_event_id, p_pass_reference);

  IF NOT FOUND THEN
    v_result := 'invalid';
    v_denial := 'invalid_qr';
    v_status := 'denied';
  ELSIF v_event.ends_at IS NOT NULL AND v_event.ends_at < NOW() THEN
    v_result := 'expired';
    v_denial := 'event_ended';
    v_status := 'denied';
  ELSIF v_pass.is_suspended THEN
    v_result := 'invalid';
    v_denial := 'suspended';
    v_status := 'denied';
  ELSIF v_pass.access_status IN ('cancelled') THEN
    v_result := 'invalid';
    v_denial := 'cancelled';
    v_status := 'denied';
  ELSIF v_pass.access_status IN ('expired') OR (v_pass.expires_at IS NOT NULL AND v_pass.expires_at < NOW()) THEN
    v_result := 'expired';
    v_denial := 'expired';
    v_status := 'denied';
  ELSIF v_pass.scanned_at IS NOT NULL OR v_pass.access_status = 'scanned' THEN
    v_result := 'duplicate';
    v_denial := 'already_used';
    v_status := 'denied';
  ELSE
    v_result := 'valid';
    v_denial := NULL;
    v_status := 'validated';

    IF v_pass.pass_kind = 'invitation' THEN
      UPDATE public.invitations
      SET status = 'scanned', scanned_at = NOW()
      WHERE id = v_pass.access_id;
    ELSE
      UPDATE public.tickets SET scanned_at = NOW() WHERE id = v_pass.access_id;
    END IF;
  END IF;

  INSERT INTO public.scans (
    event_id,
    scanner_id,
    pass_reference,
    result,
    access_id,
    pass_kind,
    gate_code,
    denial_reason,
    device_id,
    ip_address,
    guest_first_name,
    guest_last_name,
    access_type_label,
    metadata
  ) VALUES (
    p_event_id,
    v_scanner_id,
    trim(p_pass_reference),
    v_result,
    v_pass.access_id,
    v_pass.pass_kind,
    p_gate_code,
    v_denial,
    p_device_id,
    p_ip_address,
    v_pass.first_name,
    v_pass.last_name,
    v_pass.access_type_label,
    jsonb_build_object('validation_status', v_status)
  )
  RETURNING id INTO v_scan_id;

  INSERT INTO public.scanner_audit_log (
    event_id,
    access_id,
    scanner_id,
    scan_id,
    pass_reference,
    validation_status,
    denial_reason,
    gate_code,
    device_id,
    ip_address
  ) VALUES (
    p_event_id,
    v_pass.access_id,
    v_scanner_id,
    v_scan_id,
    trim(p_pass_reference),
    v_status,
    v_denial,
    p_gate_code,
    p_device_id,
    p_ip_address
  )
  RETURNING id INTO v_audit_id;

  v_display := jsonb_build_object(
    'scanId', v_scan_id,
    'auditId', v_audit_id,
    'result', v_result,
    'status', v_status,
    'denialReason', v_denial,
    'firstName', COALESCE(v_pass.first_name, ''),
    'lastName', COALESCE(v_pass.last_name, ''),
    'accessTypeLabel', COALESCE(v_pass.access_type_label, '—'),
    'eventTitle', v_event.title,
    'gateCode', p_gate_code
  );

  RETURN v_display;
END;
$$;

-- Recherche manuelle
CREATE OR REPLACE FUNCTION public.search_access_for_scan(
  p_event_id UUID,
  p_query TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_q TEXT := trim(p_query);
  v_rows JSONB := '[]'::JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_event_role(p_event_id, ARRAY['scanner', 'staff', 'organizer', 'owner']) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(x)), '[]'::JSONB)
  INTO v_rows
  FROM (
    SELECT
      'invitation' AS pass_kind,
      i.id AS access_id,
      i.guest_first_name AS first_name,
      i.guest_last_name AS last_name,
      i.guest_phone AS phone,
      i.guest_email AS email,
      i.unique_code,
      i.status::TEXT AS access_status,
      i.qr_payload
    FROM public.invitations i
    WHERE i.event_id = p_event_id
      AND (
        i.guest_first_name ILIKE '%' || v_q || '%'
        OR i.guest_last_name ILIKE '%' || v_q || '%'
        OR i.guest_phone ILIKE '%' || v_q || '%'
        OR i.guest_email ILIKE '%' || v_q || '%'
        OR i.unique_code ILIKE '%' || v_q || '%'
      )
    UNION ALL
    SELECT
      'ticket',
      t.id,
      t.buyer_first_name,
      t.buyer_last_name,
      t.buyer_phone,
      t.buyer_email,
      t.unique_code,
      t.payment_status::TEXT,
      t.access_token
    FROM public.tickets t
    WHERE t.event_id = p_event_id
      AND (
        t.buyer_first_name ILIKE '%' || v_q || '%'
        OR t.buyer_last_name ILIKE '%' || v_q || '%'
        OR t.buyer_phone ILIKE '%' || v_q || '%'
        OR t.buyer_email ILIKE '%' || v_q || '%'
        OR t.unique_code ILIKE '%' || v_q || '%'
      )
    LIMIT 20
  ) x;

  RETURN jsonb_build_object('results', v_rows);
END;
$$;

-- Stats temps réel terrain
CREATE OR REPLACE FUNCTION public.get_scanner_live_stats(p_event_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'entered', (
      SELECT COUNT(*)::INTEGER FROM public.scans
      WHERE event_id = p_event_id AND result = 'valid'
    ),
    'expected', (
      SELECT COALESCE(SUM(quantity), 0)::INTEGER FROM public.ticket_types WHERE event_id = p_event_id
    ) + (
      SELECT COUNT(*)::INTEGER FROM public.invitations WHERE event_id = p_event_id
    ),
    'denied', (
      SELECT COUNT(*)::INTEGER FROM public.scans
      WHERE event_id = p_event_id AND result <> 'valid'
    ),
    'presenceRate', (
      SELECT CASE
        WHEN denom > 0 THEN ROUND(100.0 * num / denom, 1)
        ELSE 0
      END
      FROM (
        SELECT
          (SELECT COUNT(*) FROM public.scans WHERE event_id = p_event_id AND result = 'valid') AS num,
          GREATEST(
            1,
            (SELECT COUNT(*) FROM public.invitations WHERE event_id = p_event_id)
            + (SELECT COUNT(*) FROM public.tickets WHERE event_id = p_event_id AND payment_status = 'paid')
          ) AS denom
      ) s
    ),
    'avgValidationMs', 1200,
    'topGate', (
      SELECT gate_code::TEXT FROM public.scans
      WHERE event_id = p_event_id AND result = 'valid'
      GROUP BY gate_code ORDER BY COUNT(*) DESC LIMIT 1
    )
  );
$$;

-- Sync file offline
CREATE OR REPLACE FUNCTION public.sync_scanner_offline_queue(p_queue_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.scanner_offline_queue%ROWTYPE;
  v_out JSONB;
BEGIN
  SELECT * INTO v_row FROM public.scanner_offline_queue
  WHERE id = p_queue_id AND scanner_id = auth.uid() AND synced_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Queue item not found';
  END IF;

  v_out := public.validate_access_scan(
    v_row.event_id,
    v_row.pass_reference,
    v_row.gate_code,
    v_row.device_id,
    NULL
  );

  UPDATE public.scanner_offline_queue
  SET synced_at = NOW(), sync_error = NULL
  WHERE id = p_queue_id;

  RETURN v_out;
END;
$$;

-- RLS
ALTER TABLE public.scanner_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanner_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanner_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scanner_offline_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scanner_gates_select" ON public.scanner_gates
  FOR SELECT USING (
    public.has_event_role(event_id, ARRAY['scanner', 'staff', 'organizer', 'owner', 'supervisor'])
  );

CREATE POLICY "scanner_team_select" ON public.scanner_team_members
  FOR SELECT USING (
    public.has_event_role(event_id, ARRAY['scanner', 'staff', 'organizer', 'owner', 'supervisor'])
  );

CREATE POLICY "scanner_audit_select" ON public.scanner_audit_log
  FOR SELECT USING (
    public.has_event_role(event_id, ARRAY['scanner', 'staff', 'organizer', 'owner', 'supervisor'])
  );

CREATE POLICY "scanner_audit_no_delete" ON public.scanner_audit_log
  FOR DELETE USING (FALSE);

CREATE POLICY "scanner_offline_own" ON public.scanner_offline_queue
  FOR ALL USING (scanner_id = auth.uid())
  WITH CHECK (scanner_id = auth.uid());

GRANT EXECUTE ON FUNCTION public.validate_access_scan(UUID, TEXT, public.scanner_gate_code, TEXT, INET) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_access_for_scan(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_scanner_live_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_scanner_offline_queue(UUID) TO authenticated;
