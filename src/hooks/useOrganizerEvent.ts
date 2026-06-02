import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { getOrganizerEventView } from '@/services/events.service';
import type { OrganizerEventRecord } from '@/types/organizer-event';

export function useOrganizerEventParam() {
  const { eventId } = useParams<{ eventId: string }>();
  const query = useQuery({
    queryKey: ['organizer-event', eventId],
    queryFn: () => getOrganizerEventView(eventId!),
    enabled: !!eventId,
    retry: (count, err) => {
      if (err instanceof Error && err.message === 'forbidden') return false;
      return count < 2;
    },
  });

  return {
    eventId,
    event: query.data as OrganizerEventRecord | undefined,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

export type { OrganizerEventRecord };
