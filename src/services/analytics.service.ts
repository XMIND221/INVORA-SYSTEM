import { supabase } from '@/supabase/client';

export async function trackEvent(input: {
  name: string;
  eventId?: string;
  userId?: string;
  properties?: Record<string, unknown>;
}) {
  const { error } = await supabase.from('analytics_events').insert({
    name: input.name,
    event_id: input.eventId ?? null,
    user_id: input.userId ?? null,
    properties: (input.properties ?? null) as import('@/types/database').Json,
  });

  if (error) throw error;
}

export async function getEventMetrics(eventId: string) {
  const { data, error } = await supabase
    .from('event_metrics')
    .select('*')
    .eq('event_id', eventId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
