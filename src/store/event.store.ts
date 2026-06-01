import { create } from 'zustand';
import type { Event } from '@/types/database';
import type { ExperienceDraft } from '@/types/event';

interface EventState {
  activeEvent: Event | null;
  draft: ExperienceDraft;
  studioStep: number;
  setActiveEvent: (event: Event | null) => void;
  patchDraft: (patch: Partial<ExperienceDraft>) => void;
  setStudioStep: (step: number) => void;
  clearDraft: () => void;
  resetStudio: () => void;
}

export const useEventStore = create<EventState>((set) => ({
  activeEvent: null,
  draft: {},
  studioStep: 1,
  setActiveEvent: (activeEvent) => set({ activeEvent }),
  patchDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  setStudioStep: (studioStep) => set({ studioStep }),
  clearDraft: () => set({ draft: {}, studioStep: 1 }),
  resetStudio: () => set({ draft: {}, studioStep: 1, activeEvent: null }),
}));
