import { create } from 'zustand';
import { applyTonePreset, generateDesignPackage } from '@/features/engines/design.engine';
import { DEFAULT_TONE_ADJUSTMENTS } from '@/features/engines/design-analysis.engine';
import type { DesignEventInput, DesignPackage, DesignToneAdjustments } from '@/types/design';

interface DesignState {
  toneByEvent: Record<string, DesignToneAdjustments>;
  inputsByEvent: Record<string, DesignEventInput>;
  packagesByEvent: Record<string, DesignPackage>;

  getTone: (eventId: string) => DesignToneAdjustments;
  adjustTone: (eventId: string, axis: keyof DesignToneAdjustments, delta: number) => DesignPackage;
  generate: (input: DesignEventInput) => DesignPackage;
  getPackage: (eventId: string) => DesignPackage | undefined;
}

export const useDesignStore = create<DesignState>((set, get) => ({
  toneByEvent: {},
  inputsByEvent: {},
  packagesByEvent: {},

  getTone: (eventId) => get().toneByEvent[eventId] ?? { ...DEFAULT_TONE_ADJUSTMENTS },

  adjustTone: (eventId, axis, delta) => {
    const input = get().inputsByEvent[eventId];
    if (!input) throw new Error('no_design_input');
    const tone = applyTonePreset(get().getTone(eventId), axis, delta);
    set((s) => ({ toneByEvent: { ...s.toneByEvent, [eventId]: tone } }));
    const pkg = generateDesignPackage(input, tone);
    set((s) => ({
      packagesByEvent: { ...s.packagesByEvent, [eventId]: pkg },
    }));
    return pkg;
  },

  generate: (input) => {
    const tone = get().getTone(input.eventId);
    const pkg = generateDesignPackage(input, tone);
    set((s) => ({
      inputsByEvent: { ...s.inputsByEvent, [input.eventId]: input },
      packagesByEvent: { ...s.packagesByEvent, [input.eventId]: pkg },
    }));
    return pkg;
  },

  getPackage: (eventId) => get().packagesByEvent[eventId],
}));
