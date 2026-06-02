import { useQuery } from '@tanstack/react-query';
import { vendreService } from '@/services/vendre.service';

export function useVendreAnalytics(eventId: string | undefined) {
  return useQuery({
    queryKey: ['vendre-analytics', eventId],
    queryFn: () => vendreService.analytics(eventId!),
    enabled: !!eventId,
  });
}
