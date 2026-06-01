/**
 * Minimal Supabase client schema for typed queries.
 * Domain models live in database.ts — regenerate via npm run supabase:types
 */
import type {
  AnalyticsEvent,
  AuditLog,
  Commission,
  Draft,
  Event,
  EventMetrics,
  EventRole,
  EventSettings,
  Invitation,
  Json,
  MediaAsset,
  Notification,
  Partner,
  Profile,
  Scan,
  Ticket,
  TicketType,
  Transaction,
  WalletPass,
} from './database';
import type { EventStatus, EventUniverse, EventVisibility } from './event';
import type { UserRole } from './roles';

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          primary_role?: UserRole;
          locale?: string;
        };
        Update: Partial<Profile>;
        Relationships: [];
      };
      events: {
        Row: Event;
        Insert: {
          slug: string;
          title: string;
          universe: EventUniverse;
          organizer_id: string;
          id?: string;
          description?: string | null;
          visibility?: EventVisibility;
          status?: EventStatus;
          starts_at?: string | null;
          ends_at?: string | null;
          location?: string | null;
          cover_url?: string | null;
          published_at?: string | null;
        };
        Update: Partial<Event>;
        Relationships: [];
      };
      event_roles: {
        Row: EventRole;
        Insert: {
          event_id: string;
          user_id: string;
          role: string;
          id?: string;
        };
        Update: Partial<EventRole>;
        Relationships: [];
      };
      invitations: {
        Row: Invitation;
        Insert: {
          event_id: string;
          id?: string;
          guest_email?: string | null;
          guest_name?: string | null;
          token?: string;
          status?: string;
          sent_at?: string | null;
          accepted_at?: string | null;
        };
        Update: Partial<Invitation>;
        Relationships: [];
      };
      ticket_types: {
        Row: TicketType;
        Insert: {
          event_id: string;
          name: string;
          price_cents: number;
          id?: string;
          currency?: string;
          quantity?: number | null;
          sold_count?: number;
          is_active?: boolean;
        };
        Update: Partial<TicketType>;
        Relationships: [];
      };
      tickets: {
        Row: Ticket;
        Insert: {
          event_id: string;
          ticket_type_id: string;
          qr_payload: string;
          id?: string;
          owner_id?: string | null;
          status?: string;
          purchased_at?: string | null;
        };
        Update: Partial<Ticket>;
        Relationships: [];
      };
      wallet_passes: {
        Row: WalletPass;
        Insert: {
          user_id: string;
          event_id: string;
          pass_type: WalletPass['pass_type'];
          reference_id: string;
          qr_payload: string;
          id?: string;
        };
        Update: Partial<WalletPass>;
        Relationships: [];
      };
      scans: {
        Row: Scan;
        Insert: {
          event_id: string;
          scanner_id: string;
          pass_reference: string;
          result: Scan['result'];
          id?: string;
          scanned_at?: string;
          metadata?: Json | null;
        };
        Update: Partial<Scan>;
        Relationships: [];
      };
      partners: {
        Row: Partner;
        Insert: {
          user_id: string;
          code: string;
          id?: string;
          commission_rate?: number;
          is_active?: boolean;
        };
        Update: Partial<Partner>;
        Relationships: [];
      };
      commissions: {
        Row: Commission;
        Insert: {
          partner_id: string;
          transaction_id: string;
          amount_cents: number;
          id?: string;
          status?: string;
        };
        Update: Partial<Commission>;
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        Insert: {
          event_id: string;
          amount_cents: number;
          id?: string;
          user_id?: string | null;
          currency?: string;
          provider?: string | null;
          provider_ref?: string | null;
          status?: string;
        };
        Update: Partial<Transaction>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: {
          user_id: string;
          type: string;
          title: string;
          id?: string;
          body?: string | null;
          read_at?: string | null;
          payload?: Json | null;
        };
        Update: Partial<Notification>;
        Relationships: [];
      };
      drafts: {
        Row: Draft;
        Insert: {
          user_id: string;
          entity_type: string;
          payload: Json;
          id?: string;
        };
        Update: Partial<Draft>;
        Relationships: [];
      };
      media_assets: {
        Row: MediaAsset;
        Insert: {
          event_id: string;
          bucket: string;
          path: string;
          id?: string;
          mime_type?: string | null;
        };
        Update: Partial<MediaAsset>;
        Relationships: [];
      };
      event_settings: {
        Row: EventSettings;
        Insert: EventSettings;
        Update: Partial<EventSettings>;
        Relationships: [];
      };
      event_metrics: {
        Row: EventMetrics;
        Insert: EventMetrics;
        Update: Partial<EventMetrics>;
        Relationships: [];
      };
      analytics_events: {
        Row: AnalyticsEvent;
        Insert: {
          name: string;
          id?: string;
          event_id?: string | null;
          user_id?: string | null;
          properties?: Json | null;
        };
        Update: Partial<AnalyticsEvent>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: {
          action: string;
          entity_type: string;
          id?: string;
          actor_id?: string | null;
          entity_id?: string | null;
          metadata?: Json | null;
        };
        Update: Partial<AuditLog>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
