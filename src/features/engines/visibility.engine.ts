import type { EventVisibility } from '@/types/event';

export function isPubliclyDiscoverable(visibility: EventVisibility): boolean {
  return visibility === 'public';
}

export function requiresInvitation(visibility: EventVisibility): boolean {
  return visibility === 'private';
}

export function allowsDirectLink(visibility: EventVisibility): boolean {
  return visibility === 'unlisted' || visibility === 'public';
}
