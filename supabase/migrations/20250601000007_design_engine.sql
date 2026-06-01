-- PHASE 8 — INVORA LUXURY DESIGN ENGINE (identité figée par événement)

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS design_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS design_identity JSONB,
  ADD COLUMN IF NOT EXISTS design_generated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_events_design_fingerprint ON public.events (design_fingerprint);

CREATE OR REPLACE FUNCTION public.upsert_event_design_identity(
  p_event_id UUID,
  p_fingerprint TEXT,
  p_payload JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_event_role(p_event_id, ARRAY['owner', 'organizer']) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  UPDATE public.events
  SET
    design_fingerprint = p_fingerprint,
    design_identity = p_payload,
    design_generated_at = NOW()
  WHERE id = p_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_event_design_identity(UUID, TEXT, JSONB) TO authenticated;
