/**
 * Fixtures tests uniquement — ne pas importer dans les pages production.
 * @see eventsService.getOrganizerEventView
 */
import type {
  OrganizerEventAnalytics,
  OrganizerEventMetrics,
  OrganizerEventRecord,
} from '@/types/organizer-event';

export type { OrganizerEventRecord, OrganizerEventMetrics, OrganizerEventAnalytics };

export const ORGANIZER_MOCK_EVENTS: OrganizerEventRecord[] = [
  {
    id: 'obsidian-gala',
    slug: 'obsidian-gala',
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
];

export function getOrganizerEvent(eventId: string): OrganizerEventRecord | undefined {
  return ORGANIZER_MOCK_EVENTS.find((e) => e.id === eventId || e.slug === eventId);
}
