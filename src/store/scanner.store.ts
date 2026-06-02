import { create } from 'zustand';
import type { ScannerGateCode, ScannerSession } from '@/types/scanner';

interface ScannerState {
  session: ScannerSession | null;
  paused: boolean;

  setSession: (session: ScannerSession) => void;
  setGate: (gate: ScannerGateCode) => void;
  setPaused: (paused: boolean) => void;
  getSession: () => ScannerSession | null;
}

export const useScannerStore = create<ScannerState>((set, get) => ({
  session: null,
  paused: false,

  setSession: (session) => set({ session }),
  setGate: (gate) =>
    set((s) => ({
      session: s.session ? { ...s.session, gateCode: gate } : null,
    })),
  setPaused: (paused) => set({ paused }),
  getSession: () => get().session,
}));
