/**
 * Event Engine — orchestrates INVITER & VENDRE universes.
 */
import { validatePublication } from '@/features/engines/publication.engine';
import { isInvitationUniverse } from '@/features/engines/invitation.engine';
import { isTicketingUniverse } from '@/features/engines/ticket.engine';
import * as eventsService from '@/services/events.service';
import type { Event } from '@/types/database';
import type { ExperienceDraft } from '@/types/event';

export async function createExperienceFromDraft(
  organizerId: string,
  draft: ExperienceDraft,
): Promise<Event> {
  if (!draft.title || !draft.universe || !draft.visibility) {
    throw new Error('Draft incomplet : title, universe et visibility requis.');
  }

  if (draft.eventId) {
    return eventsService.updateExperience(eventsService.draftToUpdateInput(draft, draft.eventId));
  }

  return eventsService.createExperience(eventsService.draftToCreateInput(organizerId, draft));
}

export async function publishExperienceFromDraft(
  eventId: string,
  draft: ExperienceDraft,
): Promise<Event> {
  const startsAt = draft.startsAt ?? undefined;
  const check = validatePublication({
    title: draft.title,
    universe: draft.universe,
    visibility: draft.visibility,
    ...(startsAt ? { startsAt } : {}),
  });

  if (!check.canPublish) {
    throw new Error(`Publication bloquée : ${check.blockers.join(', ')}`);
  }

  await eventsService.updateExperience(eventsService.draftToUpdateInput(draft, eventId));
  const published = await eventsService.publishExperience(eventId);

  return published;
}

export function publicationCapabilities(event: Event) {
  return {
    invitations: isInvitationUniverse(event.universe),
    ticketing: isTicketingUniverse(event.universe),
  };
}

export { isInvitationUniverse, isTicketingUniverse };
