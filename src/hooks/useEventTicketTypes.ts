import { useQuery } from '@tanstack/react-query';
import { vendreService } from '@/services/vendre.service';

export function useEventTicketTypes(eventKey: string | undefined) {
  return useQuery({
    queryKey: ['ticket-types', eventKey],
    queryFn: async () => {
      if (!eventKey) return { types: [], status: 'draft' as const };
      const types = await vendreService.listTicketTypes(eventKey);
      const status = await vendreService.getTicketingStatus(eventKey);
      return { types, status };
    },
    enabled: !!eventKey,
  });
}
