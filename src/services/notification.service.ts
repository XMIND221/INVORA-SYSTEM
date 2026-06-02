import { supabase } from '@/supabase/client';
import type { DistributionChannel } from '@/types/inviter';
import type { NotificationAnalytics, NotificationPreferences } from '@/types/notifications';

function mapPreferences(row: Record<string, unknown>): NotificationPreferences {
  const kinds = row.disabledKinds;
  return {
    emailEnabled: Boolean(row.emailEnabled ?? true),
    whatsappEnabled: Boolean(row.whatsappEnabled ?? true),
    inAppEnabled: Boolean(row.inAppEnabled ?? true),
    pushEnabled: Boolean(row.pushEnabled ?? false),
    smsEnabled: Boolean(row.smsEnabled ?? false),
    disabledKinds: Array.isArray(kinds) ? (kinds as string[]) : [],
  };
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences> {
  const { data, error } = await (
    supabase.rpc as (fn: string) => ReturnType<typeof supabase.rpc>
  )('get_notification_preferences');
  if (error) throw error;
  return mapPreferences((data ?? {}) as Record<string, unknown>);
}

export async function saveNotificationPreferences(
  prefs: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('upsert_notification_preferences', {
    p_payload: {
      emailEnabled: prefs.emailEnabled,
      whatsappEnabled: prefs.whatsappEnabled,
      inAppEnabled: prefs.inAppEnabled,
      pushEnabled: prefs.pushEnabled,
      smsEnabled: prefs.smsEnabled,
      disabledKinds: prefs.disabledKinds ?? [],
    },
  });
  if (error) throw error;
  return mapPreferences((data ?? {}) as Record<string, unknown>);
}

export async function enqueueInviterDistributions(
  eventId: string,
  invitationIds: string[],
  channels: DistributionChannel[],
): Promise<{ queued: number }> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('enqueue_inviter_distributions', {
    p_event_id: eventId,
    p_invitation_ids: invitationIds,
    p_channels: channels,
  });
  if (error) throw error;
  const row = (data ?? {}) as { queued?: number };
  return { queued: Number(row.queued ?? 0) };
}

export async function enqueueTicketDistribution(
  accessToken: string,
  channel: 'email' | 'whatsapp' | 'link' | 'download',
): Promise<void> {
  const { error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('enqueue_ticket_distribution', {
    p_access_token: accessToken,
    p_channel: channel,
  });
  if (error) throw error;
}

export async function fetchNotificationAnalytics(
  eventId?: string,
  days = 30,
): Promise<NotificationAnalytics> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('get_notification_analytics', {
    p_event_id: eventId ?? null,
    p_days: days,
  });
  if (error) throw error;
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    sent: Number(row.sent ?? 0),
    delivered: Number(row.delivered ?? 0),
    opened: Number(row.opened ?? 0),
    clicked: Number(row.clicked ?? 0),
    failed: Number(row.failed ?? 0),
    byChannel: (row.byChannel ?? {}) as Record<string, number>,
  };
}

/** Ne déclenche jamais d'envoi côté navigateur — file serveur uniquement. */
export const notificationService = {
  fetchPreferences: fetchNotificationPreferences,
  savePreferences: saveNotificationPreferences,
  enqueueInviterDistributions,
  enqueueTicketDistribution,
  fetchAnalytics: fetchNotificationAnalytics,
};
