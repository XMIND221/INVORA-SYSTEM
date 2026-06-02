import { useQuery, useQueryClient } from '@tanstack/react-query';
import { scannerService } from '@/services/scanner.service';
import { useScannerStore } from '@/store/scanner.store';

export function useScannerSession(eventId?: string) {
  return useQuery({
    queryKey: ['scanner-session', eventId],
    queryFn: async () => {
      const session = await scannerService.fetchSession(eventId);
      if (session) scannerService.setSession(session);
      return session;
    },
    staleTime: 60_000,
  });
}

export function useScannerLive(eventId: string | undefined) {
  return useQuery({
    queryKey: ['scanner-live', eventId],
    queryFn: () => (eventId ? scannerService.fetchLiveStats(eventId) : Promise.reject()),
    enabled: !!eventId,
    refetchInterval: 5000,
  });
}

export function useScannerHistory(eventId: string | undefined) {
  return useQuery({
    queryKey: ['scanner-history', eventId],
    queryFn: () => (eventId ? scannerService.fetchHistory(eventId) : Promise.resolve([])),
    enabled: !!eventId,
    refetchInterval: 8000,
  });
}

export function useScannerAnalytics(eventId: string | undefined) {
  return useQuery({
    queryKey: ['scanner-analytics', eventId],
    queryFn: () =>
      eventId ? scannerService.fetchFieldAnalytics(eventId) : Promise.reject(),
    enabled: !!eventId,
  });
}

export function useInvalidateScanner() {
  const qc = useQueryClient();
  return (eventId?: string) => {
    void qc.invalidateQueries({ queryKey: ['scanner-live', eventId] });
    void qc.invalidateQueries({ queryKey: ['scanner-history', eventId] });
    void qc.invalidateQueries({ queryKey: ['scanner-analytics', eventId] });
  };
}

export function useScannerSessionOrStore(): { session: ReturnType<typeof useScannerStore.getState>['session'] } {
  const session = useScannerStore((s) => s.session);
  return { session };
}
