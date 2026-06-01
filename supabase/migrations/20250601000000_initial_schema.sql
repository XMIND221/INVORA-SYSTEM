-- INVORA V2 — Initial database schema
-- Vision: experience-first (organisateur crée une expérience, INVORA génère le reste)

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE public.user_role AS ENUM (
  'organisateur',
  'participant',
  'partenaire',
  'scanner',
  'admin'
);

CREATE TYPE public.event_universe AS ENUM ('inviter', 'vendre');

CREATE TYPE public.event_visibility AS ENUM ('private', 'public', 'unlisted');

CREATE TYPE public.event_status AS ENUM (
  'draft',
  'scheduled',
  'published',
  'live',
  'ended',
  'archived'
);

CREATE TYPE public.scan_result AS ENUM ('valid', 'invalid', 'duplicate', 'expired');

CREATE TYPE public.wallet_pass_type AS ENUM ('invitation', 'ticket', 'access');

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  primary_role public.user_role NOT NULL DEFAULT 'participant',
  locale TEXT NOT NULL DEFAULT 'fr',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events (experiences)
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  universe public.event_universe NOT NULL,
  visibility public.event_visibility NOT NULL DEFAULT 'private',
  status public.event_status NOT NULL DEFAULT 'draft',
  organizer_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  location TEXT,
  cover_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_events_organizer ON public.events (organizer_id);
CREATE INDEX idx_events_status ON public.events (status);
CREATE INDEX idx_events_visibility ON public.events (visibility);

-- Per-event roles
CREATE TABLE public.event_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'organizer', 'staff', 'scanner', 'partner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id, role)
);

-- Invitations (INVITER universe)
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  guest_email TEXT,
  guest_name TEXT,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_event ON public.invitations (event_id);
CREATE INDEX idx_invitations_token ON public.invitations (token);

-- Ticket types (VENDRE universe)
CREATE TABLE public.ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'XOF',
  quantity INTEGER,
  sold_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tickets
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES public.ticket_types (id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  qr_payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'valid',
  purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_event ON public.tickets (event_id);
CREATE INDEX idx_tickets_owner ON public.tickets (owner_id);

-- Wallet passes
CREATE TABLE public.wallet_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  pass_type public.wallet_pass_type NOT NULL,
  reference_id UUID NOT NULL,
  qr_payload TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, pass_type, reference_id)
);
