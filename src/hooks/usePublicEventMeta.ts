import { useQuery } from '@tanstack/react-query';
import { getOrganizerEventView } from '@/services/events.service';

/** Métadonnées événement pour pages publiques (billetterie, etc.) */
export function usePublicEventMeta(eventKey: string | undefined) {
  return useQuery({
    queryKey: ['public-event', eventKey],
    queryFn: () => getOrganizerEventView(eventKey!),
    enabled: !!eventKey,
  });
}
