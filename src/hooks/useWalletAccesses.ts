import { useQuery, useQueryClient } from '@tanstack/react-query';
import { accessService } from '@/services/access.service';
import { useAuth } from '@/hooks/useAuth';

export function useWalletAccesses() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['wallet-accesses', userId],
    queryFn: () => (userId ? accessService.listAccesses(userId) : Promise.resolve([])),
    enabled: !!userId,
  });
}

export function useWalletAnalytics() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['wallet-analytics', userId],
    queryFn: () =>
      userId
        ? accessService.analytics(userId)
        : Promise.resolve({ active: 0, used: 0, expired: 0, cancelled: 0, utilizationRate: 0 }),
    enabled: !!userId,
  });
}

export function useInvalidateWallet() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: ['wallet-accesses'] });
    void qc.invalidateQueries({ queryKey: ['wallet-analytics'] });
    void qc.invalidateQueries({ queryKey: ['public-ticket'] });
  };
}
