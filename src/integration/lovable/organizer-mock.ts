/**
 * @deprecated Production : `eventsService` / `getOrganizerEventView`.
 * Réexport fixtures pour tests et scripts uniquement.
 */
export {
  ORGANIZER_MOCK_EVENTS,
  getOrganizerEvent,
  type OrganizerEventAnalytics,
  type OrganizerEventMetrics,
  type OrganizerEventRecord,
} from './__fixtures__/organizer-mock.fixture';

export function eventHubPath(eventId: string): string {
  return `/evenements/${eventId}`;
}
