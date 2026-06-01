import type { EventStatus, EventVisibility } from '@/types/event';

export interface PublicationCheck {
  canPublish: boolean;
  blockers: string[];
}

export function validatePublication(input: {
  title?: string;
  universe?: string;
  visibility?: EventVisibility;
  startsAt?: string;
}): PublicationCheck {
  const blockers: string[] = [];
  if (!input.title?.trim()) blockers.push('title_required');
  if (!input.universe) blockers.push('universe_required');
  if (!input.visibility) blockers.push('visibility_required');
  if (input.visibility === 'public' && !input.startsAt) blockers.push('starts_at_required_for_public');

  return { canPublish: blockers.length === 0, blockers };
}

export function nextStatusAfterPublish(current: EventStatus): EventStatus {
  return current === 'scheduled' ? 'scheduled' : 'published';
}
