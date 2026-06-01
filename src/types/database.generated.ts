export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      access_audit_log: {
        Row: {
          access_id: string | null
          action: string
          created_at: string
          event_id: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          access_id?: string | null
          action: string
          created_at?: string
          event_id: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          access_id?: string | null
          action?: string
          created_at?: string
          event_id?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_audit_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      access_types: {
        Row: {
          code: string
          created_at: string
          description: string | null
          event_id: string
          id: string
          label: string
          max_guests: number | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          label: string
          max_guests?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          label?: string
          max_guests?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "access_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          name: string
          properties: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          name: string
          properties?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          name?: string
          properties?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commissions: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          partner_id: string
          status: string
          transaction_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          partner_id: string
          status?: string
          transaction_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          partner_id?: string
          status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      drafts: {
        Row: {
          entity_type: string
          id: string
          payload: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          entity_type: string
          id?: string
          payload?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          entity_type?: string
          id?: string
          payload?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drafts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_metrics: {
        Row: {
          cart_adds: number
          conversion_rate: number
          event_id: string
          invitations_claimed: number
          invitations_created: number
          invitations_opened: number
          invitations_sent: number
          invitations_used: number
          invora_commission_fcfa: number
          organizer_revenue_fcfa: number
          page_views: number
          purchases_count: number
          revenue_cents: number
          scans_total: number
          tickets_sold: number
          updated_at: string
          views: number
        }
        Insert: {
          cart_adds?: number
          conversion_rate?: number
          event_id: string
          invitations_claimed?: number
          invitations_created?: number
          invitations_opened?: number
          invitations_sent?: number
          invitations_used?: number
          invora_commission_fcfa?: number
          organizer_revenue_fcfa?: number
          page_views?: number
          purchases_count?: number
          revenue_cents?: number
          scans_total?: number
          tickets_sold?: number
          updated_at?: string
          views?: number
        }
        Update: {
          cart_adds?: number
          conversion_rate?: number
          event_id?: string
          invitations_claimed?: number
          invitations_created?: number
          invitations_opened?: number
          invitations_sent?: number
          invitations_used?: number
          invora_commission_fcfa?: number
          organizer_revenue_fcfa?: number
          page_views?: number
          purchases_count?: number
          revenue_cents?: number
          scans_total?: number
          tickets_sold?: number
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_metrics_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_roles: {
        Row: {
          created_at: string
          event_id: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_roles_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_settings: {
        Row: {
          access_rules: Json | null
          branding: Json | null
          event_id: string
          notifications: Json | null
          ticketing: Json | null
          updated_at: string
        }
        Insert: {
          access_rules?: Json | null
          branding?: Json | null
          event_id: string
          notifications?: Json | null
          ticketing?: Json | null
          updated_at?: string
        }
        Update: {
          access_rules?: Json | null
          branding?: Json | null
          event_id?: string
          notifications?: Json | null
          ticketing?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_settings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          design_fingerprint: string | null
          design_generated_at: string | null
          design_identity: Json | null
          ends_at: string | null
          id: string
          location: string | null
          organizer_id: string
          published_at: string | null
          slug: string
          starts_at: string | null
          status: Database["public"]["Enums"]["event_status"]
          ticketing_status:
            | Database["public"]["Enums"]["ticketing_status"]
            | null
          title: string
          universe: Database["public"]["Enums"]["event_universe"]
          updated_at: string
          visibility: Database["public"]["Enums"]["event_visibility"]
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          design_fingerprint?: string | null
          design_generated_at?: string | null
          design_identity?: Json | null
          ends_at?: string | null
          id?: string
          location?: string | null
          organizer_id: string
          published_at?: string | null
          slug: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          ticketing_status?:
            | Database["public"]["Enums"]["ticketing_status"]
            | null
          title: string
          universe: Database["public"]["Enums"]["event_universe"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          design_fingerprint?: string | null
          design_generated_at?: string | null
          design_identity?: Json | null
          ends_at?: string | null
          id?: string
          location?: string | null
          organizer_id?: string
          published_at?: string | null
          slug?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          ticketing_status?:
            | Database["public"]["Enums"]["ticketing_status"]
            | null
          title?: string
          universe?: Database["public"]["Enums"]["event_universe"]
          updated_at?: string
          visibility?: Database["public"]["Enums"]["event_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_audit_log: {
        Row: {
          action: string
          amount_fcfa: number | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          amount_fcfa?: number | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          amount_fcfa?: number | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      finance_settlements: {
        Row: {
          created_at: string
          event_id: string
          frozen_at: string
          gross_fcfa: number
          id: string
          invora_commission_fcfa: number
          organizer_net_fcfa: number
          partner_commission_fcfa: number
          payment_status: Database["public"]["Enums"]["payment_status"]
          reference_code: string | null
          transaction_id: string
          universe: Database["public"]["Enums"]["finance_universe"]
        }
        Insert: {
          created_at?: string
          event_id: string
          frozen_at?: string
          gross_fcfa: number
          id?: string
          invora_commission_fcfa: number
          organizer_net_fcfa: number
          partner_commission_fcfa?: number
          payment_status: Database["public"]["Enums"]["payment_status"]
          reference_code?: string | null
          transaction_id: string
          universe: Database["public"]["Enums"]["finance_universe"]
        }
        Update: {
          created_at?: string
          event_id?: string
          frozen_at?: string
          gross_fcfa?: number
          id?: string
          invora_commission_fcfa?: number
          organizer_net_fcfa?: number
          partner_commission_fcfa?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          reference_code?: string | null
          transaction_id?: string
          universe?: Database["public"]["Enums"]["finance_universe"]
        }
        Relationships: [
          {
            foreignKeyName: "finance_settlements_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_settlements_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_distributions: {
        Row: {
          channel: Database["public"]["Enums"]["distribution_channel"]
          id: string
          invitation_id: string
          metadata: Json | null
          sent_at: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["distribution_channel"]
          id?: string
          invitation_id: string
          metadata?: Json | null
          sent_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["distribution_channel"]
          id?: string
          invitation_id?: string
          metadata?: Json | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_distributions_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          access_type_code: string
          cancelled_at: string | null
          claimed: boolean
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          distributed_at: string | null
          distribution_channels:
            | Database["public"]["Enums"]["distribution_channel"][]
            | null
          event_id: string
          expires_at: string | null
          guest_email: string | null
          guest_first_name: string | null
          guest_last_name: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          opened_at: string | null
          qr_payload: string | null
          scanned_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          unique_code: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          access_type_code?: string
          cancelled_at?: string | null
          claimed?: boolean
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          distributed_at?: string | null
          distribution_channels?:
            | Database["public"]["Enums"]["distribution_channel"][]
            | null
          event_id: string
          expires_at?: string | null
          guest_email?: string | null
          guest_first_name?: string | null
          guest_last_name?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          opened_at?: string | null
          qr_payload?: string | null
          scanned_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          unique_code: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          access_type_code?: string
          cancelled_at?: string | null
          claimed?: boolean
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          distributed_at?: string | null
          distribution_channels?:
            | Database["public"]["Enums"]["distribution_channel"][]
            | null
          event_id?: string
          expires_at?: string | null
          guest_email?: string | null
          guest_first_name?: string | null
          guest_last_name?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          opened_at?: string | null
          qr_payload?: string | null
          scanned_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["invitation_status"]
          token?: string
          unique_code?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          bucket: string
          created_at: string
          event_id: string
          id: string
          mime_type: string | null
          path: string
        }
        Insert: {
          bucket: string
          created_at?: string
          event_id: string
          id?: string
          mime_type?: string | null
          path: string
        }
        Update: {
          bucket?: string
          created_at?: string
          event_id?: string
          id?: string
          mime_type?: string | null
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          payload: Json | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          payload?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_balances: {
        Row: {
          available_fcfa: number
          organizer_id: string
          pending_fcfa: number
          updated_at: string
          withdrawn_fcfa: number
        }
        Insert: {
          available_fcfa?: number
          organizer_id: string
          pending_fcfa?: number
          updated_at?: string
          withdrawn_fcfa?: number
        }
        Update: {
          available_fcfa?: number
          organizer_id?: string
          pending_fcfa?: number
          updated_at?: string
          withdrawn_fcfa?: number
        }
        Relationships: [
          {
            foreignKeyName: "organizer_balances_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_payout_requests: {
        Row: {
          amount_fcfa: number
          id: string
          metadata: Json | null
          organizer_id: string
          processed_at: string | null
          requested_at: string
          status: Database["public"]["Enums"]["payout_request_status"]
        }
        Insert: {
          amount_fcfa: number
          id?: string
          metadata?: Json | null
          organizer_id: string
          processed_at?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_request_status"]
        }
        Update: {
          amount_fcfa?: number
          id?: string
          metadata?: Json | null
          organizer_id?: string
          processed_at?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["payout_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "organizer_payout_requests_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_campaigns: {
        Row: {
          campaign_code: string
          created_at: string
          event_id: string
          id: string
          is_active: boolean
          partner_id: string
          share_path: string
          universe: Database["public"]["Enums"]["partner_universe"]
        }
        Insert: {
          campaign_code: string
          created_at?: string
          event_id: string
          id?: string
          is_active?: boolean
          partner_id: string
          share_path: string
          universe: Database["public"]["Enums"]["partner_universe"]
        }
        Update: {
          campaign_code?: string
          created_at?: string
          event_id?: string
          id?: string
          is_active?: boolean
          partner_id?: string
          share_path?: string
          universe?: Database["public"]["Enums"]["partner_universe"]
        }
        Relationships: [
          {
            foreignKeyName: "partner_campaigns_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_campaigns_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_commission_ledger: {
        Row: {
          campaign_id: string | null
          commission_fcfa: number
          created_at: string
          frozen_at: string
          id: string
          partner_id: string
          reference_id: string | null
          reference_type: string
          transaction_id: string | null
          universe: Database["public"]["Enums"]["partner_universe"]
        }
        Insert: {
          campaign_id?: string | null
          commission_fcfa: number
          created_at?: string
          frozen_at?: string
          id?: string
          partner_id: string
          reference_id?: string | null
          reference_type: string
          transaction_id?: string | null
          universe: Database["public"]["Enums"]["partner_universe"]
        }
        Update: {
          campaign_id?: string | null
          commission_fcfa?: number
          created_at?: string
          frozen_at?: string
          id?: string
          partner_id?: string
          reference_id?: string | null
          reference_type?: string
          transaction_id?: string | null
          universe?: Database["public"]["Enums"]["partner_universe"]
        }
        Relationships: [
          {
            foreignKeyName: "partner_commission_ledger_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "partner_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commission_ledger_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commission_ledger_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_media_kits: {
        Row: {
          asset_key: string
          created_at: string
          event_id: string
          id: string
          label: string
          payload: Json | null
        }
        Insert: {
          asset_key: string
          created_at?: string
          event_id: string
          id?: string
          label: string
          payload?: Json | null
        }
        Update: {
          asset_key?: string
          created_at?: string
          event_id?: string
          id?: string
          label?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_media_kits_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_tracking_events: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["partner_tracking_kind"]
          metadata: Json | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["partner_tracking_kind"]
          metadata?: Json | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["partner_tracking_kind"]
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_tracking_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "partner_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_withdrawal_requests: {
        Row: {
          amount_fcfa: number
          id: string
          metadata: Json | null
          partner_id: string
          processed_at: string | null
          requested_at: string
          status: Database["public"]["Enums"]["partner_withdrawal_status"]
        }
        Insert: {
          amount_fcfa: number
          id?: string
          metadata?: Json | null
          partner_id: string
          processed_at?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["partner_withdrawal_status"]
        }
        Update: {
          amount_fcfa?: number
          id?: string
          metadata?: Json | null
          partner_id?: string
          processed_at?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["partner_withdrawal_status"]
        }
        Relationships: [
          {
            foreignKeyName: "partner_withdrawal_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          code: string
          commission_rate: number
          created_at: string
          id: string
          is_active: boolean
          user_id: string
        }
        Insert: {
          code: string
          commission_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean
          user_id: string
        }
        Update: {
          code?: string
          commission_rate?: number
          created_at?: string
          id?: string
          is_active?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_fcfa: number
          created_at: string
          id: string
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          provider: string | null
          provider_ref: string | null
          transaction_id: string
        }
        Insert: {
          amount_fcfa: number
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          provider?: string | null
          provider_ref?: string | null
          transaction_id: string
        }
        Update: {
          amount_fcfa?: number
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          provider?: string | null
          provider_ref?: string | null
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          locale: string
          phone: string | null
          primary_role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          locale?: string
          phone?: string | null
          primary_role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          locale?: string
          phone?: string | null
          primary_role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      scanner_audit_log: {
        Row: {
          access_id: string | null
          created_at: string
          denial_reason:
            | Database["public"]["Enums"]["scanner_denial_reason"]
            | null
          device_id: string | null
          event_id: string
          gate_code: Database["public"]["Enums"]["scanner_gate_code"]
          id: string
          ip_address: unknown
          metadata: Json | null
          pass_reference: string
          scan_id: string | null
          scanner_id: string
          validation_status: string
        }
        Insert: {
          access_id?: string | null
          created_at?: string
          denial_reason?:
            | Database["public"]["Enums"]["scanner_denial_reason"]
            | null
          device_id?: string | null
          event_id: string
          gate_code?: Database["public"]["Enums"]["scanner_gate_code"]
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          pass_reference: string
          scan_id?: string | null
          scanner_id: string
          validation_status: string
        }
        Update: {
          access_id?: string | null
          created_at?: string
          denial_reason?:
            | Database["public"]["Enums"]["scanner_denial_reason"]
            | null
          device_id?: string | null
          event_id?: string
          gate_code?: Database["public"]["Enums"]["scanner_gate_code"]
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          pass_reference?: string
          scan_id?: string | null
          scanner_id?: string
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "scanner_audit_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scanner_audit_log_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scanner_audit_log_scanner_id_fkey"
            columns: ["scanner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scanner_gates: {
        Row: {
          code: Database["public"]["Enums"]["scanner_gate_code"]
          created_at: string
          event_id: string
          id: string
          is_active: boolean
          label: string
        }
        Insert: {
          code: Database["public"]["Enums"]["scanner_gate_code"]
          created_at?: string
          event_id: string
          id?: string
          is_active?: boolean
          label: string
        }
        Update: {
          code?: Database["public"]["Enums"]["scanner_gate_code"]
          created_at?: string
          event_id?: string
          id?: string
          is_active?: boolean
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "scanner_gates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      scanner_offline_queue: {
        Row: {
          device_id: string | null
          event_id: string
          gate_code: Database["public"]["Enums"]["scanner_gate_code"]
          id: string
          pass_reference: string
          payload: Json | null
          queued_at: string
          scanner_id: string
          sync_error: string | null
          synced_at: string | null
        }
        Insert: {
          device_id?: string | null
          event_id: string
          gate_code?: Database["public"]["Enums"]["scanner_gate_code"]
          id?: string
          pass_reference: string
          payload?: Json | null
          queued_at?: string
          scanner_id: string
          sync_error?: string | null
          synced_at?: string | null
        }
        Update: {
          device_id?: string | null
          event_id?: string
          gate_code?: Database["public"]["Enums"]["scanner_gate_code"]
          id?: string
          pass_reference?: string
          payload?: Json | null
          queued_at?: string
          scanner_id?: string
          sync_error?: string | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scanner_offline_queue_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scanner_offline_queue_scanner_id_fkey"
            columns: ["scanner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scanner_team_members: {
        Row: {
          created_at: string
          display_name: string | null
          event_id: string
          id: string
          is_active: boolean
          team_role: Database["public"]["Enums"]["scanner_team_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          event_id: string
          id?: string
          is_active?: boolean
          team_role?: Database["public"]["Enums"]["scanner_team_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          event_id?: string
          id?: string
          is_active?: boolean
          team_role?: Database["public"]["Enums"]["scanner_team_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scanner_team_members_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scanner_team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scans: {
        Row: {
          access_id: string | null
          access_type_label: string | null
          denial_reason:
            | Database["public"]["Enums"]["scanner_denial_reason"]
            | null
          device_id: string | null
          event_id: string
          gate_code: Database["public"]["Enums"]["scanner_gate_code"] | null
          guest_first_name: string | null
          guest_last_name: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          pass_kind: string | null
          pass_reference: string
          result: Database["public"]["Enums"]["scan_result"]
          scanned_at: string
          scanner_id: string
        }
        Insert: {
          access_id?: string | null
          access_type_label?: string | null
          denial_reason?:
            | Database["public"]["Enums"]["scanner_denial_reason"]
            | null
          device_id?: string | null
          event_id: string
          gate_code?: Database["public"]["Enums"]["scanner_gate_code"] | null
          guest_first_name?: string | null
          guest_last_name?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          pass_kind?: string | null
          pass_reference: string
          result: Database["public"]["Enums"]["scan_result"]
          scanned_at?: string
          scanner_id: string
        }
        Update: {
          access_id?: string | null
          access_type_label?: string | null
          denial_reason?:
            | Database["public"]["Enums"]["scanner_denial_reason"]
            | null
          device_id?: string | null
          event_id?: string
          gate_code?: Database["public"]["Enums"]["scanner_gate_code"] | null
          guest_first_name?: string | null
          guest_last_name?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          pass_kind?: string | null
          pass_reference?: string
          result?: Database["public"]["Enums"]["scan_result"]
          scanned_at?: string
          scanner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scans_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scans_scanner_id_fkey"
            columns: ["scanner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_types: {
        Row: {
          code: string | null
          commission_fcfa: number | null
          created_at: string
          currency: string
          description: string | null
          event_id: string
          id: string
          is_active: boolean
          name: string
          organizer_net_fcfa: number | null
          price_cents: number
          quantity: number | null
          sold_count: number
          ticketing_status: Database["public"]["Enums"]["ticketing_status"]
        }
        Insert: {
          code?: string | null
          commission_fcfa?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          event_id: string
          id?: string
          is_active?: boolean
          name: string
          organizer_net_fcfa?: number | null
          price_cents?: number
          quantity?: number | null
          sold_count?: number
          ticketing_status?: Database["public"]["Enums"]["ticketing_status"]
        }
        Update: {
          code?: string | null
          commission_fcfa?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          event_id?: string
          id?: string
          is_active?: boolean
          name?: string
          organizer_net_fcfa?: number | null
          price_cents?: number
          quantity?: number | null
          sold_count?: number
          ticketing_status?: Database["public"]["Enums"]["ticketing_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          access_token: string | null
          buyer_email: string | null
          buyer_first_name: string | null
          buyer_last_name: string | null
          buyer_phone: string | null
          claimed: boolean
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          event_id: string
          id: string
          owner_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          purchased_at: string | null
          qr_payload: string
          scanned_at: string | null
          status: string
          ticket_type_id: string
          transaction_id: string | null
          unique_code: string | null
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          buyer_email?: string | null
          buyer_first_name?: string | null
          buyer_last_name?: string | null
          buyer_phone?: string | null
          claimed?: boolean
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          event_id: string
          id?: string
          owner_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          purchased_at?: string | null
          qr_payload: string
          scanned_at?: string | null
          status?: string
          ticket_type_id: string
          transaction_id?: string | null
          unique_code?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          buyer_email?: string | null
          buyer_first_name?: string | null
          buyer_last_name?: string | null
          buyer_phone?: string | null
          claimed?: boolean
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          event_id?: string
          id?: string
          owner_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          purchased_at?: string | null
          qr_payload?: string
          scanned_at?: string | null
          status?: string
          ticket_type_id?: string
          transaction_id?: string | null
          unique_code?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_cents: number
          buyer_email: string | null
          buyer_name: string | null
          buyer_phone: string | null
          commission_fcfa: number
          created_at: string
          currency: string
          event_id: string
          frozen_at: string | null
          gross_fcfa: number | null
          id: string
          organizer_net_fcfa: number
          partner_commission_fcfa: number
          payment_status: Database["public"]["Enums"]["payment_status"]
          provider: string | null
          provider_ref: string | null
          quantity: number
          reference_code: string | null
          status: string
          ticket_token: string | null
          ticket_type_id: string | null
          universe: Database["public"]["Enums"]["finance_universe"] | null
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          commission_fcfa?: number
          created_at?: string
          currency?: string
          event_id: string
          frozen_at?: string | null
          gross_fcfa?: number | null
          id?: string
          organizer_net_fcfa?: number
          partner_commission_fcfa?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          provider?: string | null
          provider_ref?: string | null
          quantity?: number
          reference_code?: string | null
          status?: string
          ticket_token?: string | null
          ticket_type_id?: string | null
          universe?: Database["public"]["Enums"]["finance_universe"] | null
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          commission_fcfa?: number
          created_at?: string
          currency?: string
          event_id?: string
          frozen_at?: string | null
          gross_fcfa?: number | null
          id?: string
          organizer_net_fcfa?: number
          partner_commission_fcfa?: number
          payment_status?: Database["public"]["Enums"]["payment_status"]
          provider?: string | null
          provider_ref?: string | null
          quantity?: number
          reference_code?: string | null
          status?: string
          ticket_token?: string | null
          ticket_type_id?: string | null
          universe?: Database["public"]["Enums"]["finance_universe"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_notification_queue: {
        Row: {
          access_id: string | null
          id: string
          kind: Database["public"]["Enums"]["wallet_notification_kind"]
          payload: Json | null
          scheduled_at: string
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          access_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["wallet_notification_kind"]
          payload?: Json | null
          scheduled_at?: string
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["wallet_notification_kind"]
          payload?: Json | null
          scheduled_at?: string
          sent_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_notification_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_pass_artifacts: {
        Row: {
          access_id: string
          artifact_url: string | null
          created_at: string
          id: string
          platform: string
          user_id: string | null
        }
        Insert: {
          access_id: string
          artifact_url?: string | null
          created_at?: string
          id?: string
          platform: string
          user_id?: string | null
        }
        Update: {
          access_id?: string
          artifact_url?: string | null
          created_at?: string
          id?: string
          platform?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_pass_artifacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_passes: {
        Row: {
          created_at: string
          event_id: string
          id: string
          pass_type: Database["public"]["Enums"]["wallet_pass_type"]
          qr_payload: string
          reference_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          pass_type: Database["public"]["Enums"]["wallet_pass_type"]
          qr_payload: string
          reference_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          pass_type?: Database["public"]["Enums"]["wallet_pass_type"]
          qr_payload?: string
          reference_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_passes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_passes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_reconciliation_runs: {
        Row: {
          created_at: string
          email: string | null
          id: string
          invitations_linked: number
          phone: string | null
          tickets_linked: number
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          invitations_linked?: number
          phone?: string | null
          tickets_linked?: number
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          invitations_linked?: number
          phone?: string | null
          tickets_linked?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_reconciliation_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      wallet_access_unified: {
        Row: {
          access_code: string | null
          access_id: string | null
          access_type: string | null
          claimed: boolean | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string | null
          email: string | null
          event_id: string | null
          holder_name: string | null
          pass_kind: string | null
          phone: string | null
          public_token: string | null
          qr_code: string | null
          status: Database["public"]["Enums"]["invora_access_status"] | null
          universe: Database["public"]["Enums"]["invora_access_universe"] | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_inviter_pricing_quote: {
        Args: { p_existing_count?: number; p_quantity: number }
        Returns: Json
      }
      calculate_inviter_unit_price: {
        Args: { p_access_index: number }
        Returns: number
      }
      calculate_invora_commission: {
        Args: { p_price_fcfa: number }
        Returns: {
          commission_fcfa: number
          currency: string
          organizer_net_fcfa: number
          price_fcfa: number
        }[]
      }
      calculate_partner_commission: {
        Args: {
          p_metric: number
          p_universe: Database["public"]["Enums"]["partner_universe"]
        }
        Returns: {
          commission_fcfa: number
          metric: number
          universe: Database["public"]["Enums"]["partner_universe"]
        }[]
      }
      calculate_partner_commission_inviter: {
        Args: { p_access_count: number }
        Returns: number
      }
      calculate_partner_commission_vendre: {
        Args: { p_ticket_price_fcfa: number }
        Returns: number
      }
      calculate_vendre_pricing_quote: {
        Args: { p_price_fcfa: number; p_quantity?: number }
        Returns: Json
      }
      claim_access: {
        Args: { p_public_token: string; p_user_id?: string }
        Returns: Json
      }
      claim_invitation: {
        Args: { p_token: string; p_user_id?: string }
        Returns: string
      }
      claim_ticket: {
        Args: { p_access_token: string; p_user_id?: string }
        Returns: string
      }
      complete_ticket_payment: {
        Args: { p_transaction_id: string }
        Returns: {
          access_token: string | null
          buyer_email: string | null
          buyer_first_name: string | null
          buyer_last_name: string | null
          buyer_phone: string | null
          claimed: boolean
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          event_id: string
          id: string
          owner_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          purchased_at: string | null
          qr_payload: string
          scanned_at: string | null
          status: string
          ticket_type_id: string
          transaction_id: string | null
          unique_code: string | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "tickets"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      create_organizer_payout_request: {
        Args: { p_amount_fcfa: number }
        Returns: string
      }
      create_partner_withdrawal_request: {
        Args: { p_amount_fcfa: number; p_partner_id: string }
        Returns: string
      }
      create_ticket_checkout: {
        Args: {
          p_buyer_email?: string
          p_buyer_name: string
          p_buyer_phone: string
          p_event_id: string
          p_quantity: number
          p_ticket_type_id: string
        }
        Returns: string
      }
      freeze_finance_settlement: {
        Args: { p_transaction_id: string }
        Returns: string
      }
      get_finance_report: {
        Args: { p_event_id?: string; p_scope: string }
        Returns: Json
      }
      get_invitation_by_token: {
        Args: { p_token: string }
        Returns: {
          access_type_code: string
          claimed: boolean
          event_id: string
          event_location: string
          event_starts_at: string
          event_title: string
          guest_email: string
          guest_first_name: string
          guest_last_name: string
          guest_phone: string
          id: string
          opened_at: string
          qr_payload: string
          status: Database["public"]["Enums"]["invitation_status"]
          token: string
          unique_code: string
        }[]
      }
      get_organizer_balance_summary: {
        Args: { p_organizer_id?: string }
        Returns: Json
      }
      get_public_ticketing: {
        Args: { p_event_slug: string }
        Returns: {
          cover_url: string
          description: string
          event_id: string
          location: string
          starts_at: string
          ticketing_status: Database["public"]["Enums"]["ticketing_status"]
          title: string
        }[]
      }
      get_scanner_live_stats: { Args: { p_event_id: string }; Returns: Json }
      get_wallet_access_analytics: {
        Args: { p_user_id?: string }
        Returns: Json
      }
      has_event_role: {
        Args: { p_event_id: string; p_roles: string[] }
        Returns: boolean
      }
      inviter_next_threshold: {
        Args: { p_after_index: number }
        Returns: number
      }
      inviter_next_tier_hint: {
        Args: { p_next_index: number }
        Returns: string
      }
      inviter_tier_label: { Args: { p_access_index: number }; Returns: string }
      is_event_organizer: { Args: { p_event_id: string }; Returns: boolean }
      list_user_wallet_accesses: {
        Args: { p_user_id?: string }
        Returns: {
          access_code: string | null
          access_id: string | null
          access_type: string | null
          claimed: boolean | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string | null
          email: string | null
          event_id: string | null
          holder_name: string | null
          pass_kind: string | null
          phone: string | null
          public_token: string | null
          qr_code: string | null
          status: Database["public"]["Enums"]["invora_access_status"] | null
          universe: Database["public"]["Enums"]["invora_access_universe"] | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "wallet_access_unified"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mark_invitation_opened: {
        Args: { p_token: string }
        Returns: Database["public"]["Enums"]["invitation_status"]
      }
      reconcile_user_invitations: {
        Args: { p_user_id?: string }
        Returns: number
      }
      reconcile_user_tickets: { Args: { p_user_id?: string }; Returns: number }
      reconcile_user_wallet: {
        Args: { p_email?: string; p_phone?: string; p_user_id?: string }
        Returns: Json
      }
      record_partner_conversion: {
        Args: {
          p_campaign_code: string
          p_metric: number
          p_reference_id: string
          p_reference_type: string
          p_transaction_id?: string
        }
        Returns: string
      }
      resolve_scan_pass: {
        Args: { p_event_id: string; p_pass_reference: string }
        Returns: {
          access_id: string
          access_status: string
          access_type_label: string
          expires_at: string
          first_name: string
          is_suspended: boolean
          last_name: string
          pass_kind: string
          scanned_at: string
        }[]
      }
      search_access_for_scan: {
        Args: { p_event_id: string; p_query: string }
        Returns: Json
      }
      search_user_wallet_accesses: {
        Args: { p_query: string; p_user_id: string }
        Returns: {
          access_code: string | null
          access_id: string | null
          access_type: string | null
          claimed: boolean | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string | null
          email: string | null
          event_id: string | null
          holder_name: string | null
          pass_kind: string | null
          phone: string | null
          public_token: string | null
          qr_code: string | null
          status: Database["public"]["Enums"]["invora_access_status"] | null
          universe: Database["public"]["Enums"]["invora_access_universe"] | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "wallet_access_unified"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      sync_scanner_offline_queue: {
        Args: { p_queue_id: string }
        Returns: Json
      }
      upsert_event_design_identity: {
        Args: { p_event_id: string; p_fingerprint: string; p_payload: Json }
        Returns: undefined
      }
      validate_access_scan: {
        Args: {
          p_device_id?: string
          p_event_id: string
          p_gate_code?: Database["public"]["Enums"]["scanner_gate_code"]
          p_ip_address?: unknown
          p_pass_reference: string
        }
        Returns: Json
      }
    }
    Enums: {
      distribution_channel: "whatsapp" | "email"
      event_status:
        | "draft"
        | "scheduled"
        | "published"
        | "live"
        | "ended"
        | "archived"
      event_universe: "inviter" | "vendre"
      event_visibility: "private" | "public" | "unlisted"
      finance_universe: "inviter" | "vendre"
      invitation_status:
        | "created"
        | "distributed"
        | "opened"
        | "claimed"
        | "scanned"
        | "expired"
        | "cancelled"
      invora_access_status:
        | "created"
        | "distributed"
        | "opened"
        | "claimed"
        | "scanned"
        | "used"
        | "expired"
        | "cancelled"
      invora_access_universe: "inviter" | "vendre"
      partner_tracking_kind: "click" | "open" | "conversion"
      partner_universe: "inviter" | "vendre"
      partner_withdrawal_status: "pending" | "approved" | "paid" | "rejected"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      payout_entity_type: "organizer" | "partner"
      payout_request_status: "pending" | "approved" | "paid" | "rejected"
      scan_result: "valid" | "invalid" | "duplicate" | "expired"
      scanner_denial_reason:
        | "invalid_qr"
        | "expired"
        | "already_used"
        | "cancelled"
        | "suspended"
        | "event_ended"
      scanner_gate_code:
        | "main"
        | "vip"
        | "backstage"
        | "press"
        | "staff"
        | "corporate"
      scanner_team_role: "chef_scanner" | "scanner_agent" | "supervisor"
      ticketing_status:
        | "draft"
        | "published"
        | "on_sale"
        | "sold_out"
        | "ended"
        | "archived"
      user_role:
        | "organisateur"
        | "participant"
        | "partenaire"
        | "scanner"
        | "admin"
      wallet_notification_kind:
        | "access_received"
        | "access_claimed"
        | "access_used"
        | "access_expired"
        | "event_reminder"
      wallet_pass_type: "invitation" | "ticket" | "access"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      distribution_channel: ["whatsapp", "email"],
      event_status: [
        "draft",
        "scheduled",
        "published",
        "live",
        "ended",
        "archived",
      ],
      event_universe: ["inviter", "vendre"],
      event_visibility: ["private", "public", "unlisted"],
      finance_universe: ["inviter", "vendre"],
      invitation_status: [
        "created",
        "distributed",
        "opened",
        "claimed",
        "scanned",
        "expired",
        "cancelled",
      ],
      invora_access_status: [
        "created",
        "distributed",
        "opened",
        "claimed",
        "scanned",
        "used",
        "expired",
        "cancelled",
      ],
      invora_access_universe: ["inviter", "vendre"],
      partner_tracking_kind: ["click", "open", "conversion"],
      partner_universe: ["inviter", "vendre"],
      partner_withdrawal_status: ["pending", "approved", "paid", "rejected"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      payout_entity_type: ["organizer", "partner"],
      payout_request_status: ["pending", "approved", "paid", "rejected"],
      scan_result: ["valid", "invalid", "duplicate", "expired"],
      scanner_denial_reason: [
        "invalid_qr",
        "expired",
        "already_used",
        "cancelled",
        "suspended",
        "event_ended",
      ],
      scanner_gate_code: [
        "main",
        "vip",
        "backstage",
        "press",
        "staff",
        "corporate",
      ],
      scanner_team_role: ["chef_scanner", "scanner_agent", "supervisor"],
      ticketing_status: [
        "draft",
        "published",
        "on_sale",
        "sold_out",
        "ended",
        "archived",
      ],
      user_role: [
        "organisateur",
        "participant",
        "partenaire",
        "scanner",
        "admin",
      ],
      wallet_notification_kind: [
        "access_received",
        "access_claimed",
        "access_used",
        "access_expired",
        "event_reminder",
      ],
      wallet_pass_type: ["invitation", "ticket", "access"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
