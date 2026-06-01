-- INVORA V2 — Remaining tables, triggers, RLS, storage

-- Scans
CREATE TABLE public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  scanner_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  pass_reference TEXT NOT NULL,
  result public.scan_result NOT NULL,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_scans_event ON public.scans (event_id, scanned_at DESC);

-- Partners
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.05 CHECK (commission_rate >= 0 AND commission_rate <= 1),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'XOF',
  provider TEXT,
  provider_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Commissions
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners (id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions (id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytics
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events (id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  properties JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_event ON public.analytics_events (event_id, created_at DESC);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  read_at TIMESTAMPTZ,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications (user_id, created_at DESC);

-- Drafts
CREATE TABLE public.drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, entity_type)
);

-- Media assets
CREATE TABLE public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  bucket TEXT NOT NULL,
  path TEXT NOT NULL,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event settings
CREATE TABLE public.event_settings (
  event_id UUID PRIMARY KEY REFERENCES public.events (id) ON DELETE CASCADE,
  branding JSONB,
  access_rules JSONB,
  ticketing JSONB,
  notifications JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event metrics
CREATE TABLE public.event_metrics (
  event_id UUID PRIMARY KEY REFERENCES public.events (id) ON DELETE CASCADE,
  views INTEGER NOT NULL DEFAULT 0,
  invitations_sent INTEGER NOT NULL DEFAULT 0,
  tickets_sold INTEGER NOT NULL DEFAULT 0,
  scans_total INTEGER NOT NULL DEFAULT 0,
  revenue_cents INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_created ON public.audit_logs (created_at DESC);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, primary_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NULL),
    COALESCE((NEW.raw_user_meta_data ->> 'primary_role')::public.user_role, 'participant')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Helper: check event access
CREATE OR REPLACE FUNCTION public.is_event_organizer(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = p_event_id AND e.organizer_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_event_role(p_event_id UUID, p_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_event_organizer(p_event_id)
    OR EXISTS (
      SELECT 1 FROM public.event_roles er
      WHERE er.event_id = p_event_id
        AND er.user_id = auth.uid()
        AND er.role = ANY (p_roles)
    );
$$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Events policies
CREATE POLICY "events_select" ON public.events
  FOR SELECT USING (
    visibility = 'public'
    OR organizer_id = auth.uid()
    OR public.has_event_role(id, ARRAY['owner', 'organizer', 'staff', 'scanner', 'partner'])
  );

CREATE POLICY "events_insert_organizer" ON public.events
  FOR INSERT WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "events_update_organizer" ON public.events
  FOR UPDATE USING (public.is_event_organizer(id));

CREATE POLICY "events_delete_organizer" ON public.events
  FOR DELETE USING (public.is_event_organizer(id));

-- Event roles
CREATE POLICY "event_roles_select" ON public.event_roles
  FOR SELECT USING (public.has_event_role(event_id, ARRAY['owner', 'organizer', 'staff']));

CREATE POLICY "event_roles_manage" ON public.event_roles
  FOR ALL USING (public.is_event_organizer(event_id));

-- Invitations
CREATE POLICY "invitations_organizer" ON public.invitations
  FOR ALL USING (public.is_event_organizer(event_id));

-- Ticket types & tickets
CREATE POLICY "ticket_types_organizer" ON public.ticket_types
  FOR ALL USING (public.is_event_organizer(event_id));

CREATE POLICY "tickets_select" ON public.tickets
  FOR SELECT USING (
    owner_id = auth.uid()
    OR public.has_event_role(event_id, ARRAY['owner', 'organizer', 'staff', 'scanner'])
  );

CREATE POLICY "tickets_insert_organizer" ON public.tickets
  FOR INSERT WITH CHECK (public.is_event_organizer(event_id));

-- Wallet
CREATE POLICY "wallet_own" ON public.wallet_passes
  FOR ALL USING (user_id = auth.uid());

-- Scans
CREATE POLICY "scans_insert_scanner" ON public.scans
  FOR INSERT WITH CHECK (
    public.has_event_role(event_id, ARRAY['scanner', 'staff', 'organizer', 'owner'])
    AND scanner_id = auth.uid()
  );

CREATE POLICY "scans_select_staff" ON public.scans
  FOR SELECT USING (
    public.has_event_role(event_id, ARRAY['scanner', 'staff', 'organizer', 'owner'])
  );

-- Partners
CREATE POLICY "partners_own" ON public.partners
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "commissions_own" ON public.commissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.partners p
      WHERE p.id = partner_id AND p.user_id = auth.uid()
    )
  );

-- Transactions
CREATE POLICY "transactions_select" ON public.transactions
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_event_organizer(event_id)
  );

-- Analytics
CREATE POLICY "analytics_insert" ON public.analytics_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "analytics_select_organizer" ON public.analytics_events
  FOR SELECT USING (
    event_id IS NULL OR public.is_event_organizer(event_id)
  );

-- Notifications
CREATE POLICY "notifications_own" ON public.notifications
  FOR ALL USING (user_id = auth.uid());

-- Drafts
CREATE POLICY "drafts_own" ON public.drafts
  FOR ALL USING (user_id = auth.uid());

-- Media, settings, metrics
CREATE POLICY "media_organizer" ON public.media_assets
  FOR ALL USING (public.is_event_organizer(event_id));

CREATE POLICY "settings_organizer" ON public.event_settings
  FOR ALL USING (public.is_event_organizer(event_id));

CREATE POLICY "metrics_organizer" ON public.event_metrics
  FOR SELECT USING (public.is_event_organizer(event_id));

-- Audit logs (insert via service role / edge functions; read organizer)
CREATE POLICY "audit_insert_authenticated" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "audit_select_organizer" ON public.audit_logs
  FOR SELECT USING (
    actor_id = auth.uid()
    OR (entity_type = 'event' AND entity_id IS NOT NULL AND public.is_event_organizer(entity_id))
  );

-- Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('event-media', 'event-media', true),
  ('avatars', 'avatars', true),
  ('qr-assets', 'qr-assets', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_upload_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_read_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "event_media_organizer" ON storage.objects
  FOR ALL USING (
    bucket_id = 'event-media' AND auth.role() = 'authenticated'
  );

CREATE POLICY "qr_assets_authenticated" ON storage.objects
  FOR SELECT USING (bucket_id = 'qr-assets' AND auth.role() = 'authenticated');

-- Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.scans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_metrics;
