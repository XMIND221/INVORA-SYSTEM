-- PHASE 11A — SOURCE OF TRUTH & EVENT ENGINE

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS capacity INTEGER CHECK (capacity IS NULL OR capacity > 0);

CREATE OR REPLACE FUNCTION public.log_event_audit(
  p_action TEXT,
  p_event_id UUID,
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
  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (auth.uid(), p_action, 'event', p_event_id, p_metadata)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_experience(
  p_title TEXT,
  p_universe public.event_universe,
  p_visibility public.event_visibility,
  p_description TEXT DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_starts_at TIMESTAMPTZ DEFAULT NULL,
  p_ends_at TIMESTAMPTZ DEFAULT NULL,
  p_cover_url TEXT DEFAULT NULL,
  p_capacity INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_slug TEXT;
  v_uid UUID := auth.uid();
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  IF p_title IS NULL OR length(trim(p_title)) < 2 THEN RAISE EXCEPTION 'invalid_title'; END IF;

  v_slug := lower(regexp_replace(trim(p_title), '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(encode(gen_random_bytes(4), 'hex'), 1, 8);

  INSERT INTO public.events (
    slug, title, description, universe, visibility, status,
    organizer_id, starts_at, ends_at, location, cover_url, capacity
  ) VALUES (
    v_slug, trim(p_title), p_description, p_universe, p_visibility, 'draft',
    v_uid, p_starts_at, p_ends_at, p_location, p_cover_url, p_capacity
  )
  RETURNING id INTO v_id;

  INSERT INTO public.event_metrics (event_id) VALUES (v_id) ON CONFLICT DO NOTHING;
  INSERT INTO public.event_roles (event_id, user_id, role) VALUES (v_id, v_uid, 'owner')
  ON CONFLICT DO NOTHING;

  PERFORM public.log_event_audit('experience_created', v_id, jsonb_build_object('universe', p_universe));

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_experience(
  p_event_id UUID,
  p_title TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_universe public.event_universe DEFAULT NULL,
  p_visibility public.event_visibility DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_starts_at TIMESTAMPTZ DEFAULT NULL,
  p_ends_at TIMESTAMPTZ DEFAULT NULL,
  p_cover_url TEXT DEFAULT NULL,
  p_capacity INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  IF NOT public.is_event_organizer(p_event_id) THEN RAISE EXCEPTION 'forbidden'; END IF;

  UPDATE public.events SET
    title = COALESCE(NULLIF(trim(p_title), ''), title),
    description = COALESCE(p_description, description),
    universe = COALESCE(p_universe, universe),
    visibility = COALESCE(p_visibility, visibility),
    location = COALESCE(p_location, location),
    starts_at = COALESCE(p_starts_at, starts_at),
    ends_at = COALESCE(p_ends_at, ends_at),
    cover_url = COALESCE(p_cover_url, cover_url),
    capacity = COALESCE(p_capacity, capacity),
    updated_at = NOW()
  WHERE id = p_event_id;

  PERFORM public.log_event_audit('experience_updated', p_event_id, '{}'::JSONB);
  RETURN p_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_experience(p_event_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  IF NOT public.is_event_organizer(p_event_id) THEN RAISE EXCEPTION 'forbidden'; END IF;

  UPDATE public.events
  SET status = 'published', published_at = COALESCE(published_at, NOW()), updated_at = NOW()
  WHERE id = p_event_id AND status IN ('draft', 'scheduled');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_status_transition';
  END IF;

  PERFORM public.log_event_audit('experience_published', p_event_id, '{}'::JSONB);
  RETURN p_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_experience(p_event_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  IF NOT public.is_event_organizer(p_event_id) THEN RAISE EXCEPTION 'forbidden'; END IF;

  UPDATE public.events
  SET status = 'archived', updated_at = NOW()
  WHERE id = p_event_id;

  PERFORM public.log_event_audit('experience_archived', p_event_id, '{}'::JSONB);
  RETURN p_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reactivate_experience(p_event_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  IF NOT public.is_event_organizer(p_event_id) THEN RAISE EXCEPTION 'forbidden'; END IF;

  UPDATE public.events
  SET status = 'published', updated_at = NOW()
  WHERE id = p_event_id AND status = 'archived';

  PERFORM public.log_event_audit('experience_reactivated', p_event_id, '{}'::JSONB);
  RETURN p_event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_draft_experience(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  IF NOT public.is_event_organizer(p_event_id) THEN RAISE EXCEPTION 'forbidden'; END IF;

  DELETE FROM public.events WHERE id = p_event_id AND status = 'draft';
  IF NOT FOUND THEN RAISE EXCEPTION 'not_draft_or_not_found'; END IF;

  PERFORM public.log_event_audit('experience_deleted', p_event_id, '{}'::JSONB);
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.duplicate_experience(p_event_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_src public.events%ROWTYPE;
  v_new_id UUID;
  v_slug TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'auth_required'; END IF;
  IF NOT public.is_event_organizer(p_event_id) THEN RAISE EXCEPTION 'forbidden'; END IF;

  SELECT * INTO v_src FROM public.events WHERE id = p_event_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'event_not_found'; END IF;

  v_slug := v_src.slug || '-copy-' || substr(encode(gen_random_bytes(3), 'hex'), 1, 6);

  INSERT INTO public.events (
    slug, title, description, universe, visibility, status,
    organizer_id, starts_at, ends_at, location, cover_url, capacity
  ) VALUES (
    v_slug, v_src.title || ' (copie)', v_src.description, v_src.universe, v_src.visibility, 'draft',
    auth.uid(), v_src.starts_at, v_src.ends_at, v_src.location, v_src.cover_url, v_src.capacity
  )
  RETURNING id INTO v_new_id;

  INSERT INTO public.event_metrics (event_id) VALUES (v_new_id);
  INSERT INTO public.event_roles (event_id, user_id, role) VALUES (v_new_id, auth.uid(), 'owner');

  PERFORM public.log_event_audit('experience_duplicated', v_new_id, jsonb_build_object('source_id', p_event_id));
  RETURN v_new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_event_by_slug_or_id(p_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event public.events%ROWTYPE;
  v_metrics public.event_metrics%ROWTYPE;
BEGIN
  SELECT * INTO v_event FROM public.events
  WHERE id::TEXT = p_key OR slug = p_key
  LIMIT 1;

  IF NOT FOUND THEN RETURN NULL; END IF;

  IF v_event.organizer_id <> auth.uid()
    AND NOT public.has_event_role(v_event.id, ARRAY['owner', 'organizer', 'staff', 'scanner', 'partner'])
    AND NOT (v_event.visibility = 'public' AND v_event.status IN ('published', 'live'))
  THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT * INTO v_metrics FROM public.event_metrics WHERE event_id = v_event.id;

  RETURN jsonb_build_object(
    'event', to_jsonb(v_event),
    'metrics', to_jsonb(v_metrics)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_event_audit(TEXT, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_experience(TEXT, public.event_universe, public.event_visibility, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_experience(UUID, TEXT, TEXT, public.event_universe, public.event_visibility, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_experience(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_experience(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_experience(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_draft_experience(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.duplicate_experience(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_by_slug_or_id(TEXT) TO authenticated, anon;
