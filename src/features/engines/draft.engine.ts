import type { ExperienceDraft } from '@/types/event';

export function mergeDraft(
  existing: ExperienceDraft,
  patch: Partial<ExperienceDraft>,
): ExperienceDraft {
  return { ...existing, ...patch };
}

export function isDraftEmpty(draft: ExperienceDraft): boolean {
  return !draft.title && !draft.description && !draft.universe;
}
