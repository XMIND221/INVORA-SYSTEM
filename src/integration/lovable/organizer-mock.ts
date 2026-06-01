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

export interface OrganizerEventRecord {
  id: string;
  title: string;
  dateLabel: string;
  location: string;
  description: string;
  universe: EventUniverse;
  visibility: EventVisibility;
  status: EventStatus;
  metrics: OrganizerEventMetrics;
  analytics: OrganizerEventAnalytics;
  /** Index 0–4 : Créer → Configurer → Publier → Gérer → Analyser */
  journeyStep: number;
  /** Index parcours univers (INVITER / VENDRE flow) */
  universeFlowStep: number;
}

export const ORGANIZER_MOCK_EVENTS: OrganizerEventRecord[] = [
  {
    id: 'obsidian-gala',
    title: 'Obsidian Gala',
    dateLabel: '24 DÉC',
    location: 'Paris, FR',
    description: 'Soirée privée — dress code noir absolu.',
    universe: 'inviter',
    visibility: 'private',
    status: 'live',
    journeyStep: 3,
    universeFlowStep: 2,
    metrics: {
      accesses: 482,
      accessesMax: 600,
      tickets: 0,
      ticketsMax: 0,
      scans: 218,
      conversions: 78,
      revenueEur: 0,
      partners: 12,
    },
    analytics: {
      views: 1240,
      invitationsSent: 520,
      invitationsAccepted: 482,
      ticketsSold: 0,
      scansDone: 218,
      attendanceRate: 92,
      activePartners: 8,
    },
  },
  {
    id: 'showcase-06',
    title: 'Showcase 06',
    dateLabel: '06 DÉC',
    location: 'Pantin, FR',
    description: 'Release party — billetterie ouverte.',
    universe: 'vendre',
    visibility: 'public',
    status: 'published',
    journeyStep: 2,
    universeFlowStep: 1,
    metrics: {
      accesses: 0,
      accessesMax: 0,
      tickets: 212,
      ticketsMax: 300,
      scans: 0,
      conversions: 64,
      revenueEur: 8480,
      partners: 5,
    },
    analytics: {
      views: 3200,
      invitationsSent: 0,
      invitationsAccepted: 0,
      ticketsSold: 212,
      scansDone: 0,
      attendanceRate: 0,
      activePartners: 3,
    },
  },
  {
    id: 'brunch-prive',
    title: 'Brunch Privé',
    dateLabel: '28 NOV',
    location: 'Saint-Germain',
    description: 'Petit comité — liste fermée.',
    universe: 'inviter',
    visibility: 'private',
    status: 'ended',
    journeyStep: 4,
    universeFlowStep: 4,
    metrics: {
      accesses: 40,
      accessesMax: 40,
      tickets: 0,
      ticketsMax: 0,
      scans: 38,
      conversions: 95,
      revenueEur: 0,
      partners: 2,
    },
    analytics: {
      views: 180,
      invitationsSent: 42,
      invitationsAccepted: 40,
      ticketsSold: 0,
      scansDone: 38,
      attendanceRate: 95,
      activePartners: 1,
    },
  },
];

export function getOrganizerEvent(eventId: string): OrganizerEventRecord | undefined {
  return ORGANIZER_MOCK_EVENTS.find((e) => e.id === eventId);
}

export function eventHubPath(eventId: string): string {
  return `/evenements/${eventId}`;
}
