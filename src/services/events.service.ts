import { supabase } from '@/supabase/client';
import type { Event } from '@/types/database';
import type { EventUniverse, EventVisibility } from '@/types/event';

export interface CreateExperienceInput {
  title: string;
  universe: EventUniverse;
  visibility: EventVisibility;
  organizerId: string;
  description?: string;
  startsAt?: string;
  endsAt?: string;
  location?: string;
}

export async function createExperience(input: CreateExperienceInput): Promise<Event> {
  const slug = generateSlug(input.title);

  const { data, error } = await supabase
    .from('events')
    .insert({
      title: input.title,
      slug,
      universe: input.universe,
      visibility: input.visibility,
      status: 'draft',
      organizer_id: input.organizerId,
      description: input.description ?? null,
      starts_at: input.startsAt ?? null,
      ends_at: input.endsAt ?? null,
      location: input.location ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getEventById(eventId: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listOrganizerEvents(organizerId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_id', organizerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base}-${Date.now().toString(36)}`;
}
