import { supabase } from '@/supabase/client';
import {
  enqueueOfflineScan,
  listPendingOfflineScans,
  pendingOfflineCount,
  removeOfflineScan,
  setOfflineServerQueueId,
} from '@/lib/scanner-offline-queue';
import { useScannerStore } from '@/store/scanner.store';
import type {
  ScannerDisplayStatus,
  ScannerFieldAnalytics,
  ScannerGateCode,
  ScannerHistoryEntry,
  ScannerLiveStats,
  ScannerSearchHit,
  ScannerSession,
  ScannerValidationDisplay,
} from '@/types/scanner';

type RpcValidation = {
  scanId?: string;
  auditId?: string;
  result?: string;
  status?: string;
  displayStatus?: string;
  denialReason?: string;
  firstName?: string;
  lastName?: string;
  accessTypeLabel?: string;
  eventTitle?: string;
  gateCode?: string;
  gateLabel?: string;
  passKind?: string;
  validationMs?: number;
};

function mapRpc(row: RpcValidation): ScannerValidationDisplay {
  const displayStatus = (row.displayStatus ?? 'UNKNOWN') as ScannerValidationDisplay['displayStatus'];
  return {
    scanId: String(row.scanId ?? ''),
    auditId: String(row.auditId ?? ''),
    result: (row.result as ScannerValidationDisplay['result']) ?? 'invalid',
    status: (row.status as ScannerValidationDisplay['status']) ?? 'denied',
    displayStatus,
    denialReason: row.denialReason as ScannerValidationDisplay['denialReason'],
    firstName: row.firstName ?? '',
    lastName: row.lastName ?? '',
    accessTypeLabel: row.accessTypeLabel ?? '—',
    eventTitle: row.eventTitle ?? '',
    gateCode: (row.gateCode as ScannerGateCode) ?? 'main',
    gateLabel: row.gateLabel,
    passKind: row.passKind as ScannerValidationDisplay['passKind'],
    validationMs: row.validationMs,
  };
}

function mapDisplayToResult(display: ScannerDisplayStatus): ScannerValidationDisplay['result'] {
  if (display === 'VALID') return 'valid';
  if (display === 'USED') return 'duplicate';
  if (display === 'EXPIRED') return 'expired';
  return 'invalid';
}

export async function fetchScannerSession(eventId?: string): Promise<ScannerSession | null> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('get_scanner_session_context', { p_event_id: eventId ?? null });

  if (error || !data || typeof data !== 'object') return null;
  const row = data as Record<string, string>;
  return {
    eventId: String(row.eventId),
    eventTitle: String(row.eventTitle),
    gateCode: (row.gateCode as ScannerGateCode) ?? 'main',
    agentName: String(row.agentName ?? 'Agent'),
    teamRole: (row.teamRole as ScannerSession['teamRole']) ?? 'scanner_agent',
  };
}

export async function validateAccessScan(input: {
  eventId: string;
  passReference: string;
  gateCode: ScannerGateCode;
  deviceId?: string;
  offline?: boolean;
}): Promise<ScannerValidationDisplay> {
  const deviceId = input.deviceId ?? getDeviceId();

  if (input.offline || !navigator.onLine) {
    const local = enqueueOfflineScan({
      eventId: input.eventId,
      passReference: input.passReference,
      gateCode: input.gateCode,
      deviceId,
    });
    try {
      const { data: queueId, error } = await (
        supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
      )('enqueue_scanner_offline_scan', {
        p_event_id: input.eventId,
        p_pass_reference: input.passReference,
        p_gate_code: input.gateCode,
        p_device_id: deviceId,
        p_payload: { localId: local.id },
      });
      if (!error && queueId) setOfflineServerQueueId(local.id, String(queueId));
    } catch {
      /* file locale uniquement */
    }

    return {
      scanId: local.id,
      auditId: '',
      result: 'valid',
      status: 'validated',
      displayStatus: 'VALID',
      firstName: '',
      lastName: '',
      accessTypeLabel: '—',
      eventTitle: '',
      gateCode: input.gateCode,
    };
  }

  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('validate_access_scan', {
    p_event_id: input.eventId,
    p_pass_reference: input.passReference,
    p_gate_code: input.gateCode,
    p_device_id: deviceId,
    p_ip_address: null,
  });

  if (error) throw error;
  if (!data || typeof data !== 'object') throw new Error('validation_failed');

  const display = mapRpc(data as RpcValidation);
  if (!display.result) {
    display.result = mapDisplayToResult(display.displayStatus);
  }
  return display;
}

export async function searchAccessForScan(eventId: string, query: string): Promise<ScannerSearchHit[]> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('search_access_for_scan', { p_event_id: eventId, p_query: query });

  if (error) throw error;
  const results = (data as { results?: ScannerSearchHit[] })?.results ?? [];
  return (results as ScannerSearchHit[]).map((r) => ({
    ...r,
    passReference: r.passReference || r.uniqueCode || '',
  }));
}

export async function fetchScannerLiveStats(eventId: string): Promise<ScannerLiveStats> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('get_scanner_live_stats', { p_event_id: eventId });

  if (error) throw error;
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    entered: Number(row.entered ?? 0),
    expected: Number(row.expected ?? 0),
    denied: Number(row.denied ?? 0),
    presenceRate: Number(row.presenceRate ?? 0),
    avgValidationMs: Number(row.avgValidationMs ?? 450),
    topGate: (row.topGate as ScannerGateCode) ?? null,
    recentIncidents: Number(row.recentIncidents ?? 0),
  };
}

export async function fetchScannerHistory(eventId: string, limit = 100): Promise<ScannerHistoryEntry[]> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('get_scanner_history', { p_event_id: eventId, p_limit: limit });

  if (error) throw error;
  return (Array.isArray(data) ? data : []) as unknown as ScannerHistoryEntry[];
}

export async function fetchScannerFieldAnalytics(eventId: string): Promise<ScannerFieldAnalytics> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('get_scanner_field_analytics', { p_event_id: eventId });

  if (error) throw error;
  const row = (data ?? {}) as Record<string, unknown>;
  const scansByGate = (row.scansByGate ?? {}) as Record<ScannerGateCode, number>;
  return {
    validated: Number(row.validated ?? 0),
    denied: Number(row.denied ?? 0),
    avgValidationMs: Number(row.avgValidationMs ?? 450),
    topGate: (row.topGate as ScannerGateCode) ?? null,
    peakHour: String(row.peakHour ?? '—'),
    scansByGate,
  };
}

export async function syncOfflineQueue(): Promise<number> {
  try {
    const { data, error } = await (
      supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
    )('sync_scanner_offline_batch', { p_limit: 50 });
    if (!error && data && typeof data === 'object') {
      const synced = Number((data as { synced?: number }).synced ?? 0);
      if (synced > 0) {
        listPendingOfflineScans().forEach((item) => removeOfflineScan(item.id));
      }
      return synced;
    }
  } catch {
    /* fallback local */
  }

  const pending = listPendingOfflineScans();
  const session = useScannerStore.getState().session;
  let synced = 0;
  for (const item of pending) {
    try {
      await validateAccessScan({
        eventId: item.eventId || session?.eventId || '',
        passReference: item.passReference,
        gateCode: item.gateCode,
        deviceId: item.deviceId,
        offline: false,
      });
      removeOfflineScan(item.id);
      synced += 1;
    } catch {
      break;
    }
  }
  return synced;
}

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('invora_scanner_device_id');
  if (!id) {
    id = `web-${crypto.randomUUID().slice(0, 8)}`;
    localStorage.setItem('invora_scanner_device_id', id);
  }
  return id;
}

export const scannerService = {
  fetchSession: fetchScannerSession,
  getSession: () => useScannerStore.getState().session,
  setSession: (s: ScannerSession) => useScannerStore.getState().setSession(s),
  setGate: (gate: ScannerGateCode) => useScannerStore.getState().setGate(gate),
  setPaused: (paused: boolean) => useScannerStore.getState().setPaused(paused),
  validateScan: validateAccessScan,
  search: searchAccessForScan,
  fetchLiveStats: fetchScannerLiveStats,
  fetchHistory: fetchScannerHistory,
  fetchFieldAnalytics: fetchScannerFieldAnalytics,
  offlinePendingCount: pendingOfflineCount,
  syncOffline: syncOfflineQueue,
};
