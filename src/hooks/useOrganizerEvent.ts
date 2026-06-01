import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getOrganizerEvent } from '@/integration/lovable/organizer-mock';

export function useOrganizerEventParam(): OrganizerEventResult {
  const { eventId } = useParams<{ eventId: string }>();
  const event = useMemo(
    () => (eventId ? getOrganizerEvent(eventId) : undefined),
    [eventId],
  );
  return { eventId, event };
}

export interface OrganizerEventResult {
  eventId: string | undefined;
  event: ReturnType<typeof getOrganizerEvent>;
}
