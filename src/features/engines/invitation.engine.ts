import type { EventUniverse } from '@/types/event';

export function isInvitationUniverse(universe: EventUniverse): boolean {
  return universe === 'inviter';
}

export function canSendInvitation(eventStatus: string): boolean {
  return ['draft', 'scheduled', 'published', 'live'].includes(eventStatus);
}

export function buildInvitationShareUrl(baseUrl: string, token: string): string {
  return `${baseUrl}/invite/${token}`;
}
