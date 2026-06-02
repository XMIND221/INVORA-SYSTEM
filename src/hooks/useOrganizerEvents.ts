import { useQuery } from '@tanstack/react-query';
import { getOrganizerEvents } from '@/services/events.service';
import { useAuth } from '@/hooks/useAuth';

export function useOrganizerEvents() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ['organizer-events', user?.id],
    queryFn: () => getOrganizerEvents(user!.id),
    enabled: isAuthenticated && !!user?.id,
  });

  return {
    events: query.data ?? [],
    isLoading: authLoading || query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
    isAuthenticated,
  };
}
