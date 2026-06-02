import { supabase } from '@/supabase/client';
import { mapEventToOrganizerView } from '@/lib/organizer-event-mapper';
import type { Event } from '@/types/database';
import type { OrganizerEventRecord } from '@/types/organizer-event';
import type { EventUniverse, EventVisibility, ExperienceDraft } from '@/types/event';

export interface CreateExperienceInput {
  title: string;
  universe: EventUniverse;
  visibility: EventVisibility;
  organizerId: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  location?: string;
  coverUrl?: string;
  capacity?: number;
}

export interface UpdateExperienceInput {
  eventId: string;
  title?: string;
  description?: string;
  universe?: EventUniverse;
  visibility?: EventVisibility;
  location?: string;
  startsAt?: string;
  endsAt?: string;
  coverUrl?: string;
  capacity?: number;
}

type RpcRow = Record<string, unknown>;

function parseEventRow(row: Event): Event {
  return row;
}

export async function createExperience(input: CreateExperienceInput): Promise<Event> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('create_experience', {
    p_title: input.title,
    p_universe: input.universe,
    p_visibility: input.visibility,
    p_description: input.description ?? null,
    p_location: input.location ?? null,
    p_starts_at: input.startsAt ?? null,
    p_ends_at: input.endsAt ?? null,
    p_cover_url: input.coverUrl ?? null,
    p_capacity: input.capacity ?? null,
  });

  if (error) throw error;
  const id = String(data);
  const event = await getEvent(id);
  if (!event) throw new Error('event_create_failed');
  return event;
}

export async function updateExperience(input: UpdateExperienceInput): Promise<Event> {
  const { error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('update_experience', {
    p_event_id: input.eventId,
    p_title: input.title ?? null,
    p_description: input.description ?? null,
    p_universe: input.universe ?? null,
    p_visibility: input.visibility ?? null,
    p_location: input.location ?? null,
    p_starts_at: input.startsAt ?? null,
    p_ends_at: input.endsAt ?? null,
    p_cover_url: input.coverUrl ?? null,
    p_capacity: input.capacity ?? null,
  });

  if (error) throw error;
  const event = await getEvent(input.eventId);
  if (!event) throw new Error('event_update_failed');
  return event;
}

export async function publishExperience(eventId: string): Promise<Event> {
  const { error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('publish_experience', { p_event_id: eventId });

  if (error) throw error;
  const event = await getEvent(eventId);
  if (!event) throw new Error('event_publish_failed');
  return event;
}

export async function archiveExperience(eventId: string): Promise<Event> {
  const { error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('archive_experience', { p_event_id: eventId });

  if (error) throw error;
  const event = await getEvent(eventId);
  if (!event) throw new Error('event_archive_failed');
  return event;
}

export async function reactivateExperience(eventId: string): Promise<Event> {
  const { error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('reactivate_experience', { p_event_id: eventId });

  if (error) throw error;
  const event = await getEvent(eventId);
  if (!event) throw new Error('event_reactivate_failed');
  return event;
}

export async function deleteDraft(eventId: string): Promise<void> {
  const { error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('delete_draft_experience', { p_event_id: eventId });

  if (error) throw error;
}

export async function duplicateExperience(eventId: string): Promise<Event> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('duplicate_experience', { p_event_id: eventId });

  if (error) throw error;
  const id = String(data);
  const event = await getEvent(id);
  if (!event) throw new Error('event_duplicate_failed');
  return event;
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const { data, error } = await supabase.from('events').select('*').eq('id', eventId).maybeSingle();

  if (error) throw error;
  return data ? parseEventRow(data as unknown as Event) : null;
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const { data, error } = await supabase.from('events').select('*').eq('slug', slug).maybeSingle();

  if (error) throw error;
  return data ? parseEventRow(data as unknown as Event) : null;
}

/** @deprecated use getEvent */
export const getEventById = getEvent;

export async function getOrganizerEventView(key: string): Promise<OrganizerEventRecord | null> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('get_event_by_slug_or_id', { p_key: key });

  if (error) {
    if (error.message.includes('forbidden')) throw new Error('forbidden');
    throw error;
  }
  if (!data || typeof data !== 'object') return null;

  const payload = data as unknown as { event: Event; metrics: RpcRow | null };
  return mapEventToOrganizerView(payload.event, payload.metrics);
}

export async function getOrganizerEvents(organizerId: string): Promise<OrganizerEventRecord[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*, event_metrics(*)')
    .eq('organizer_id', organizerId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const r = row as unknown as Event & { event_metrics: RpcRow | RpcRow[] | null };
    const metrics = Array.isArray(r.event_metrics) ? r.event_metrics[0] : r.event_metrics;
    return mapEventToOrganizerView(r, metrics);
  });
}

/** @deprecated use getOrganizerEvents */
export async function listOrganizerEvents(organizerId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', organizerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as Event[];
}

export function draftToCreateInput(organizerId: string, draft: ExperienceDraft): CreateExperienceInput {
  if (!draft.title || !draft.universe || !draft.visibility) {
    throw new Error('Draft incomplet');
  }
  return {
    title: draft.title,
    universe: draft.universe,
    visibility: draft.visibility,
    organizerId,
    description: draft.description,
    location: draft.location,
    startsAt: draft.startsAt,
    endsAt: draft.endsAt,
    coverUrl: draft.coverUrl,
    capacity: draft.capacity,
  };
}

export function draftToUpdateInput(draft: ExperienceDraft, eventId: string): UpdateExperienceInput {
  return {
    eventId,
    title: draft.title,
    description: draft.description,
    universe: draft.universe,
    visibility: draft.visibility,
    location: draft.location,
    startsAt: draft.startsAt,
    endsAt: draft.endsAt,
    coverUrl: draft.coverUrl,
    capacity: draft.capacity,
  };
}
