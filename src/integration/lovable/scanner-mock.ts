/** @deprecated Production : scanner.service.ts + Supabase RPC. Tests uniquement. */
import type {
  ScannerFieldAnalytics,
  ScannerHistoryEntry,
  ScannerLiveStats,
  ScannerSession,
} from '@/types/scanner';
import { MOCK_INVITER_GUESTS } from '@/integration/lovable/inviter-mock';
import { buildGuestQrPayload } from '@/features/engines/inviter.engine';

export const MOCK_SCANNER_SESSION: ScannerSession = {
  eventId: 'obsidian-gala',
  eventTitle: 'Obsidian Gala',
  gateCode: 'main',
  agentName: 'Agent K.',
  teamRole: 'scanner_agent',
};

export const MOCK_SCANNER_HISTORY: ScannerHistoryEntry[] = [
  {
    id: 'sh-1',
    at: new Date(Date.now() - 4000).toISOString(),
    gateCode: 'main',
    agentName: 'Agent K.',
    status: 'validated',
    guestName: 'Léa Martin',
    accessTypeLabel: 'Standard',
    passReference: 'INV-OBSIDI-4827',
  },
  {
    id: 'sh-2',
    at: new Date(Date.now() - 18000).toISOString(),
    gateCode: 'vip',
    agentName: 'Agent K.',
    status: 'validated',
    guestName: 'Aminata Diallo',
    accessTypeLabel: 'VIP',
    passReference: MOCK_INVITER_GUESTS[0]!.qrPayload,
  },
  {
    id: 'sh-3',
    at: new Date(Date.now() - 42000).toISOString(),
    gateCode: 'main',
    agentName: 'Agent K.',
    status: 'denied',
    denialReason: 'already_used',
    guestName: 'Sofia Ndiaye',
    accessTypeLabel: 'Staff',
    passReference: buildGuestQrPayload('obsidian-gala', 'g-5', 'tok-sofia-obsidian'),
  },
  {
    id: 'sh-4',
    at: new Date(Date.now() - 90000).toISOString(),
    gateCode: 'main',
    agentName: 'Agent K.',
    status: 'denied',
    denialReason: 'invalid_qr',
    guestName: '—',
    accessTypeLabel: '—',
    passReference: 'FAKE-QR-000',
  },
];

export const MOCK_SCANNER_LIVE: ScannerLiveStats = {
  entered: 218,
  expected: 630,
  denied: 3,
  presenceRate: 34.6,
  avgValidationMs: 1180,
  topGate: 'main',
  recentIncidents: 2,
};

export const MOCK_SCANNER_ANALYTICS: ScannerFieldAnalytics = {
  validated: 218,
  denied: 3,
  avgValidationMs: 1180,
  topGate: 'main',
  peakHour: '21:30',
  scansByGate: {
    main: 142,
    vip: 48,
    backstage: 12,
    press: 8,
    staff: 6,
    corporate: 2,
  },
};
