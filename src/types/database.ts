/**
 * Domain models — business layer types.
 * Supabase client types: see supabase.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  primary_role: import('./roles').UserRole;
  locale: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  universe: import('./event').EventUniverse;
  visibility: import('./event').EventVisibility;
  status: import('./event').EventStatus;
  organizer_id: string;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  cover_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventRole {
  id: string;
  event_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export interface Invitation {
  id: string;
  event_id: string;
  guest_email: string | null;
  guest_name: string | null;
  guest_first_name?: string | null;
  guest_last_name?: string | null;
  guest_phone?: string | null;
  access_type_code?: string;
  unique_code?: string;
  qr_payload?: string | null;
  token: string;
  status: string;
  sent_at?: string | null;
  accepted_at?: string | null;
  opened_at?: string | null;
  distributed_at?: string | null;
  distribution_channels?: string[];
  claimed?: boolean;
  claimed_at?: string | null;
  claimed_by?: string | null;
  user_id?: string | null;
  scanned_at?: string | null;
  cancelled_at?: string | null;
  expires_at?: string | null;
  created_at: string;
}

export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  price_cents: number;
  currency: string;
  quantity: number | null;
  sold_count: number;
  is_active: boolean;
  created_at: string;
}

export interface Ticket {
  id: string;
  event_id: string;
  ticket_type_id: string;
  owner_id: string | null;
  qr_payload: string;
  status: string;
  purchased_at: string | null;
  created_at: string;
}

export interface WalletPass {
  id: string;
  user_id: string;
  event_id: string;
  pass_type: 'invitation' | 'ticket' | 'access';
  reference_id: string;
  qr_payload: string;
  created_at: string;
}

export interface Scan {
  id: string;
  event_id: string;
  scanner_id: string;
  pass_reference: string;
  result: 'valid' | 'invalid' | 'duplicate' | 'expired';
  scanned_at: string;
  metadata: Json | null;
}

export interface Partner {
  id: string;
  user_id: string;
  code: string;
  commission_rate: number;
  is_active: boolean;
  created_at: string;
}

export interface Commission {
  id: string;
  partner_id: string;
  transaction_id: string;
  amount_cents: number;
  status: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  event_id: string;
  user_id: string | null;
  amount_cents: number;
  currency: string;
  provider: string | null;
  provider_ref: string | null;
  status: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  read_at: string | null;
  payload: Json | null;
  created_at: string;
}

export interface Draft {
  id: string;
  user_id: string;
  entity_type: string;
  payload: Json;
  updated_at: string;
}

export interface MediaAsset {
  id: string;
  event_id: string;
  bucket: string;
  path: string;
  mime_type: string | null;
  created_at: string;
}

export interface EventSettings {
  event_id: string;
  branding: Json | null;
  access_rules: Json | null;
  ticketing: Json | null;
  notifications: Json | null;
  updated_at: string;
}

export interface EventMetrics {
  event_id: string;
  views: number;
  invitations_sent: number;
  tickets_sold: number;
  scans_total: number;
  revenue_cents: number;
  updated_at: string;
}

export interface AnalyticsEvent {
  id: string;
  event_id: string | null;
  user_id: string | null;
  name: string;
  properties: Json | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Json | null;
  created_at: string;
}
