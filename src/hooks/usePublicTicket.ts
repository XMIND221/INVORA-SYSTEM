import { useQuery } from '@tanstack/react-query';
import { getPublicTicketByToken } from '@/services/tickets.service';

export function usePublicTicket(token: string | undefined) {
  return useQuery({
    queryKey: ['public-ticket', token],
    queryFn: () => (token ? getPublicTicketByToken(token) : Promise.resolve(null)),
    enabled: !!token,
  });
}
