import { create } from 'zustand';
import { parseQrPayload } from '@/features/engines/qr.engine';
import { recordFixtureValidation } from '@/features/engines/scanner-pro.engine';
import {
  MOCK_SCANNER_ANALYTICS,
  MOCK_SCANNER_HISTORY,
  MOCK_SCANNER_LIVE,
  MOCK_SCANNER_SESSION,
} from '@/integration/lovable/scanner-mock';
import type {
  ScannerDenialReason,
  ScannerFieldAnalytics,
  ScannerGateCode,
  ScannerHistoryEntry,
  ScannerLiveStats,
  ScannerSearchHit,
  ScannerSession,
  ScannerValidationDisplay,
} from '@/types/scanner';
import { MOCK_INVITER_GUESTS } from '@/integration/lovable/inviter-mock';

interface ScannerState {
  session: ScannerSession;
  history: ScannerHistoryEntry[];
  live: ScannerLiveStats;
  analytics: ScannerFieldAnalytics;
  paused: boolean;

  getSession: () => ScannerSession;
  setGate: (gate: ScannerGateCode) => void;
  setPaused: (paused: boolean) => void;
  listHistory: () => ScannerHistoryEntry[];
  liveStats: () => ScannerLiveStats;
  fieldAnalytics: () => ScannerFieldAnalytics;

  /** Fixture terrain — prod: scannerService.validateScan → RPC */
  validateFixture: (passReference: string) => ScannerValidationDisplay;
  applyServerValidation: (
    display: ScannerValidationDisplay,
    passReference: string,
  ) => void;
  searchFixture: (query: string) => ScannerSearchHit[];
}

function findGuestByRef(ref: string) {
  const trimmed = ref.trim();
  return MOCK_INVITER_GUESTS.find(
    (g) =>
      g.qrPayload === trimmed ||
      g.uniqueCode === trimmed ||
      g.token === trimmed ||
      (g.uniqueCode && g.uniqueCode.toUpperCase() === trimmed.toUpperCase()),
  );
}

function resolvePassReference(ref: string): string {
  const payload = parseQrPayload(ref);
  if (payload?.referenceId) {
    const guest = MOCK_INVITER_GUESTS.find((g) => g.id === payload.referenceId);
    if (guest?.qrPayload) return guest.qrPayload;
  }
  return ref.trim();
}

function fixtureDenial(guest: ReturnType<typeof findGuestByRef>): ScannerDenialReason | null {
  if (!guest) return 'invalid_qr';
  if (guest.status === 'cancelled') return 'cancelled';
  if (guest.status === 'expired') return 'expired';
  if (guest.status === 'scanned' || guest.scannedAt) return 'already_used';
  return null;
}

export const useScannerStore = create<ScannerState>((set, get) => ({
  session: { ...MOCK_SCANNER_SESSION },
  history: [...MOCK_SCANNER_HISTORY],
  live: { ...MOCK_SCANNER_LIVE },
  analytics: { ...MOCK_SCANNER_ANALYTICS },
  paused: false,

  getSession: () => get().session,
  setGate: (gate) =>
    set((s) => ({ session: { ...s.session, gateCode: gate } })),
  setPaused: (paused) => set({ paused }),
  listHistory: () => get().history,
  liveStats: () => get().live,
  fieldAnalytics: () => get().analytics,

  validateFixture: (passReference) => {
    const session = get().session;
    const resolved = resolvePassReference(passReference);
    const guest = findGuestByRef(resolved);
    const denial = fixtureDenial(guest);
    const accessLabel =
      guest?.accessTypeCode === 'vip'
        ? 'VIP'
        : guest?.accessTypeCode === 'staff'
          ? 'Staff'
          : guest
            ? 'Standard'
            : '—';

    const display: ScannerValidationDisplay = {
      scanId: `scan-${Date.now()}`,
      auditId: `audit-${Date.now()}`,
      result: denial ? (denial === 'already_used' ? 'duplicate' : denial === 'expired' ? 'expired' : 'invalid') : 'valid',
      status: denial ? 'denied' : 'validated',
      denialReason: denial ?? undefined,
      firstName: guest?.firstName ?? '',
      lastName: guest?.lastName ?? '',
      accessTypeLabel: accessLabel,
      eventTitle: session.eventTitle,
      gateCode: session.gateCode,
    };

    const { history, live, analytics } = recordFixtureValidation({
      display,
      passReference: resolved,
      agentName: session.agentName,
      history: get().history,
      live: get().live,
      analytics: get().analytics,
    });

    if (!denial && guest) {
      guest.status = 'scanned';
      guest.scannedAt = new Date().toISOString();
    }

    set({ history, live, analytics });
    return display;
  },

  applyServerValidation: (display, passReference) => {
    const session = get().session;
    const { history, live, analytics } = recordFixtureValidation({
      display,
      passReference,
      agentName: session.agentName,
      history: get().history,
      live: get().live,
      analytics: get().analytics,
    });
    set({ history, live, analytics });
  },

  searchFixture: (query) => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return MOCK_INVITER_GUESTS.filter((g) => {
      const name = `${g.firstName} ${g.lastName}`.toLowerCase();
      return (
        name.includes(q) ||
        (g.phone?.includes(q) ?? false) ||
        (g.email?.toLowerCase().includes(q) ?? false) ||
        (g.uniqueCode?.toLowerCase().includes(q) ?? false)
      );
    }).map((g) => ({
      passKind: 'invitation' as const,
      accessId: g.id,
      firstName: g.firstName,
      lastName: g.lastName,
      phone: g.phone ?? null,
      email: g.email ?? null,
      uniqueCode: g.uniqueCode ?? null,
      accessStatus: g.status,
      passReference: g.qrPayload,
    }));
  },
}));
