-- CUSTOMER CRM — contacts, ownership, and interaction history

CREATE TYPE public.customer_contact_status AS ENUM (
  'lead',
  'prospect',
  'customer',
  'vip',
  'archived'
);

CREATE TYPE public.customer_interaction_type AS ENUM (
  'note',
  'call',
  'email',
  'meeting',
  'whatsapp'
);

CREATE TABLE public.customer_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events (id) ON DELETE SET NULL,
  full_name TEXT NOT NULL CHECK (length(trim(full_name)) >= 2),
  email TEXT,
  phone TEXT,
  company TEXT,
  status public.customer_contact_status NOT NULL DEFAULT 'lead',
  source TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  notes TEXT,
  last_contact_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT customer_contacts_email_or_phone CHECK (
    email IS NOT NULL OR phone IS NOT NULL
  )
);

CREATE TABLE public.customer_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customer_contacts (id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type public.customer_interaction_type NOT NULL DEFAULT 'note',
  title TEXT NOT NULL CHECK (length(trim(title)) >= 2),
  body TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_contacts_owner ON public.customer_contacts (owner_id);
CREATE INDEX idx_customer_contacts_event ON public.customer_contacts (event_id);
CREATE INDEX idx_customer_contacts_status ON public.customer_contacts (status);
CREATE INDEX idx_customer_contacts_created ON public.customer_contacts (created_at DESC);
CREATE INDEX idx_customer_contacts_search ON public.customer_contacts USING gin (
  to_tsvector(
    'simple',
    coalesce(full_name, '') || ' ' ||
      coalesce(email, '') || ' ' ||
      coalesce(phone, '') || ' ' ||
      coalesce(company, '')
  )
);
CREATE INDEX idx_customer_interactions_customer ON public.customer_interactions (
  customer_id,
  occurred_at DESC
);
CREATE INDEX idx_customer_interactions_owner ON public.customer_interactions (owner_id);

ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customer_contacts_select_owned_or_event"
  ON public.customer_contacts
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR (event_id IS NOT NULL AND public.is_event_organizer(event_id))
    OR (event_id IS NOT NULL AND public.has_event_role(event_id, ARRAY['owner', 'organizer', 'staff']))
  );

CREATE POLICY "customer_contacts_insert_owned"
  ON public.customer_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND (
      event_id IS NULL
      OR public.is_event_organizer(event_id)
      OR public.has_event_role(event_id, ARRAY['owner', 'organizer', 'staff'])
    )
  );

CREATE POLICY "customer_contacts_update_owned_or_event"
  ON public.customer_contacts
  FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR (event_id IS NOT NULL AND public.is_event_organizer(event_id))
    OR (event_id IS NOT NULL AND public.has_event_role(event_id, ARRAY['owner', 'organizer', 'staff']))
  )
  WITH CHECK (
    owner_id = auth.uid()
    AND (
      event_id IS NULL
      OR public.is_event_organizer(event_id)
      OR public.has_event_role(event_id, ARRAY['owner', 'organizer', 'staff'])
    )
  );

CREATE POLICY "customer_contacts_delete_owned"
  ON public.customer_contacts
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "customer_interactions_select_owned_or_contact"
  ON public.customer_interactions
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.customer_contacts c
      WHERE c.id = customer_interactions.customer_id
        AND (
          c.owner_id = auth.uid()
          OR (c.event_id IS NOT NULL AND public.is_event_organizer(c.event_id))
          OR (c.event_id IS NOT NULL AND public.has_event_role(c.event_id, ARRAY['owner', 'organizer', 'staff']))
        )
    )
  );

CREATE POLICY "customer_interactions_insert_owned_contact"
  ON public.customer_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.customer_contacts c
      WHERE c.id = customer_interactions.customer_id
        AND (
          c.owner_id = auth.uid()
          OR (c.event_id IS NOT NULL AND public.is_event_organizer(c.event_id))
          OR (c.event_id IS NOT NULL AND public.has_event_role(c.event_id, ARRAY['owner', 'organizer', 'staff']))
        )
    )
  );

CREATE POLICY "customer_interactions_update_owned"
  ON public.customer_interactions
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "customer_interactions_delete_owned"
  ON public.customer_interactions
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());
