import { create } from 'zustand';
import type { Event } from '@/types/database';
import type { ExperienceDraft } from '@/types/event';

interface EventState {
  activeEvent: Event | null;
  draft: ExperienceDraft;
  setActiveEvent: (event: Event | null) => void;
  patchDraft: (patch: Partial<ExperienceDraft>) => void;
  clearDraft: () => void;
}

export const useEventStore = create<EventState>((set) => ({
  activeEvent: null,
  draft: {},
  setActiveEvent: (activeEvent) => set({ activeEvent }),
  patchDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  clearDraft: () => set({ draft: {} }),
}));
