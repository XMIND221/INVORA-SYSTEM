import { useQuery, useQueryClient } from '@tanstack/react-query';
import { partnerService } from '@/services/partner.service';
import { useAuth } from '@/hooks/useAuth';

export function usePartnerDashboard() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ['partner-dashboard', userId],
    queryFn: async () => {
      if (!userId) return null;
      await partnerService.ensureProfile(userId);
      return partnerService.fetchDashboard(userId);
    },
    enabled: !!userId,
  });
}

export function usePartnerWithdrawals(partnerId: string | undefined) {
  return useQuery({
    queryKey: ['partner-withdrawals', partnerId],
    queryFn: () => (partnerId ? partnerService.listWithdrawals(partnerId) : Promise.resolve([])),
    enabled: !!partnerId,
  });
}

export function useInvalidatePartner() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: ['partner-dashboard'] });
}
