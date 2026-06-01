import { guestDisplayName } from '@/features/engines/scanner.engine';
import type {
  ScannerFieldAnalytics,
  ScannerGateCode,
  ScannerHistoryEntry,
  ScannerLiveStats,
  ScannerValidationDisplay,
} from '@/types/scanner';

export function recordFixtureValidation(input: {
  display: ScannerValidationDisplay;
  passReference: string;
  agentName: string;
  history: ScannerHistoryEntry[];
  live: ScannerLiveStats;
  analytics: ScannerFieldAnalytics;
}): {
  history: ScannerHistoryEntry[];
  live: ScannerLiveStats;
  analytics: ScannerFieldAnalytics;
} {
  const entry: ScannerHistoryEntry = {
    id: input.display.scanId,
    at: new Date().toISOString(),
    gateCode: input.display.gateCode,
    agentName: input.agentName,
    status: input.display.status,
    denialReason: input.display.denialReason,
    guestName: guestDisplayName(input.display.firstName, input.display.lastName),
    accessTypeLabel: input.display.accessTypeLabel,
    passReference: input.passReference,
  };

  const validated = input.display.status === 'validated';
  const history = [entry, ...input.history].slice(0, 200);
  const live: ScannerLiveStats = {
    ...input.live,
    entered: validated ? input.live.entered + 1 : input.live.entered,
    denied: validated ? input.live.denied : input.live.denied + 1,
    presenceRate:
      input.live.expected > 0
        ? Math.round((1000 * (validated ? input.live.entered + 1 : input.live.entered)) / input.live.expected) / 10
        : input.live.presenceRate,
    recentIncidents: validated ? input.live.recentIncidents : input.live.recentIncidents + 1,
  };

  const gate = input.display.gateCode;
  const scansByGate = { ...input.analytics.scansByGate };
  scansByGate[gate] = (scansByGate[gate] ?? 0) + 1;

  const analytics: ScannerFieldAnalytics = {
    ...input.analytics,
    validated: validated ? input.analytics.validated + 1 : input.analytics.validated,
    denied: validated ? input.analytics.denied : input.analytics.denied + 1,
    scansByGate,
    topGate: Object.entries(scansByGate).sort((a, b) => b[1] - a[1])[0]?.[0] as ScannerGateCode,
  };

  return { history, live, analytics };
}

export function computeFieldAnalytics(history: ScannerHistoryEntry[]): ScannerFieldAnalytics {
  const validated = history.filter((h) => h.status === 'validated').length;
  const denied = history.filter((h) => h.status === 'denied').length;
  const scansByGate: ScannerFieldAnalytics['scansByGate'] = {
    main: 0,
    vip: 0,
    backstage: 0,
    press: 0,
    staff: 0,
    corporate: 0,
  };
  for (const h of history) {
    if (h.status === 'validated') scansByGate[h.gateCode] += 1;
  }
  const top = Object.entries(scansByGate).sort((a, b) => b[1] - a[1])[0];
  return {
    validated,
    denied,
    avgValidationMs: 1200,
    topGate: (top?.[1] ? top[0] : null) as ScannerGateCode | null,
    peakHour: '21:30',
    scansByGate,
  };
}
