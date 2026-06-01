/**
 * Event Engine — orchestrates INVITER & VENDRE universes.
 * User creates an "experience"; INVORA generates invitations, tickets, access, QR, etc.
 */
import { validatePublication } from '@/features/engines/publication.engine';
import { isInvitationUniverse } from '@/features/engines/invitation.engine';
import { isTicketingUniverse } from '@/features/engines/ticket.engine';
import { eventsService } from '@/services';
import type { CreateExperienceInput } from '@/services/events.service';
import type { Event } from '@/types/database';
import type { ExperienceDraft } from '@/types/event';

export async function createExperienceFromDraft(
  organizerId: string,
  draft: ExperienceDraft,
): Promise<Event> {
  if (!draft.title || !draft.universe || !draft.visibility) {
    throw new Error('Draft incomplet : title, universe et visibility requis.');
  }

  const input: CreateExperienceInput = {
    title: draft.title,
    universe: draft.universe,
    visibility: draft.visibility,
    organizerId,
    ...(draft.description ? { description: draft.description } : {}),
    ...(draft.startsAt ? { startsAt: draft.startsAt } : {}),
    ...(draft.endsAt ? { endsAt: draft.endsAt } : {}),
    ...(draft.location ? { location: draft.location } : {}),
  };

  return eventsService.createExperience(input);
}

export async function publishExperience(event: Event, draft: ExperienceDraft) {
  const startsAt = draft.startsAt ?? event.starts_at ?? undefined;
  const check = validatePublication({
    title: draft.title ?? event.title,
    universe: draft.universe ?? event.universe,
    visibility: draft.visibility ?? event.visibility,
    ...(startsAt ? { startsAt } : {}),
  });

  if (!check.canPublish) {
    throw new Error(`Publication bloquée : ${check.blockers.join(', ')}`);
  }

  return {
    event,
    capabilities: {
      invitations: isInvitationUniverse(event.universe),
      ticketing: isTicketingUniverse(event.universe),
    },
  };
}

export { isInvitationUniverse, isTicketingUniverse };
