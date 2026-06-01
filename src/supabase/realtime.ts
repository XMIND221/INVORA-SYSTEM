import type { RealtimeChannel } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import { supabase } from './client';

export function subscribeToEvent(
  eventId: string,
  handlers: {
    onScan?: (payload: unknown) => void;
    onMetrics?: (payload: unknown) => void;
  },
): RealtimeChannel | null {
  if (!env.VITE_ENABLE_REALTIME) return null;

  const channel = supabase
    .channel(`event:${eventId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'scans', filter: `event_id=eq.${eventId}` },
      (payload) => handlers.onScan?.(payload),
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'event_metrics',
        filter: `event_id=eq.${eventId}`,
      },
      (payload) => handlers.onMetrics?.(payload),
    )
    .subscribe();

  return channel;
}

export function unsubscribeChannel(channel: RealtimeChannel) {
  return supabase.removeChannel(channel);
}
