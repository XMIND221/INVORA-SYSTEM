import type { EventStatus, EventUniverse, EventVisibility } from '@/types/event';

export interface OrganizerEventMetrics {
  accesses: number;
  accessesMax: number;
  tickets: number;
  ticketsMax: number;
  scans: number;
  conversions: number;
  revenueEur: number;
  partners: number;
}

export interface OrganizerEventAnalytics {
  views: number;
  invitationsSent: number;
  invitationsAccepted: number;
  ticketsSold: number;
  scansDone: number;
  attendanceRate: number;
  activePartners: number;
}

/** Vue organisateur — dérivée de Supabase (events + event_metrics) */
export interface OrganizerEventRecord {
  id: string;
  slug: string;
  title: string;
  dateLabel: string;
  location: string;
  description: string;
  universe: EventUniverse;
  visibility: EventVisibility;
  status: EventStatus;
  metrics: OrganizerEventMetrics;
  analytics: OrganizerEventAnalytics;
  journeyStep: number;
  universeFlowStep: number;
}
