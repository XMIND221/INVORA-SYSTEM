import type { EVENT_STATUS, EVENT_UNIVERSES, EVENT_VISIBILITY } from '@/lib/constants';

export type EventUniverse = (typeof EVENT_UNIVERSES)[number];
export type EventVisibility = (typeof EVENT_VISIBILITY)[number];
export type EventStatus = (typeof EVENT_STATUS)[number];

export interface ExperienceDraft {
  title?: string;
  description?: string;
  universe?: EventUniverse;
  visibility?: EventVisibility;
  startsAt?: string;
  endsAt?: string;
  location?: string;
  settings?: Record<string, unknown>;
}

export interface PublicationPayload {
  eventId: string;
  publishedAt: string;
  visibility: EventVisibility;
}
