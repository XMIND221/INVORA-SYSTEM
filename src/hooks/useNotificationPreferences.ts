import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notification.service';
import type { NotificationPreferences } from '@/types/notifications';

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => notificationService.fetchPreferences(),
    staleTime: 60_000,
  });
}

export function useSaveNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Partial<NotificationPreferences>) =>
      notificationService.savePreferences(prefs),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
  });
}
