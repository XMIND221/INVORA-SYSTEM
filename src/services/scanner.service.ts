import { supabase } from '@/supabase/client';
import {
  enqueueOfflineScan,
  listPendingOfflineScans,
  pendingOfflineCount,
  removeOfflineScan,
} from '@/lib/scanner-offline-queue';
import { useScannerStore } from '@/store/scanner.store';
import type {
  ScannerGateCode,
  ScannerSearchHit,
  ScannerValidationDisplay,
} from '@/types/scanner';

type RpcValidation = {
  scanId?: string;
  auditId?: string;
  result?: string;
  status?: string;
  denialReason?: string;
  firstName?: string;
  lastName?: string;
  accessTypeLabel?: string;
  eventTitle?: string;
  gateCode?: string;
};

function mapRpc(row: RpcValidation): ScannerValidationDisplay {
  return {
    scanId: String(row.scanId ?? ''),
    auditId: String(row.auditId ?? ''),
    result: (row.result as ScannerValidationDisplay['result']) ?? 'invalid',
    status: (row.status as ScannerValidationDisplay['status']) ?? 'denied',
    denialReason: row.denialReason as ScannerValidationDisplay['denialReason'],
    firstName: row.firstName ?? '',
    lastName: row.lastName ?? '',
    accessTypeLabel: row.accessTypeLabel ?? '—',
    eventTitle: row.eventTitle ?? '',
    gateCode: (row.gateCode as ScannerGateCode) ?? 'main',
  };
}

/** Validation officielle — RPC / Edge uniquement. */
export async function validateAccessScan(input: {
  eventId: string;
  passReference: string;
  gateCode: ScannerGateCode;
  deviceId?: string;
  offline?: boolean;
}): Promise<ScannerValidationDisplay> {
  if (input.offline || !navigator.onLine) {
    enqueueOfflineScan({
      eventId: input.eventId,
      passReference: input.passReference,
      gateCode: input.gateCode,
      deviceId: input.deviceId,
    });
    return useScannerStore.getState().validateFixture(input.passReference);
  }

  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('validate_access_scan', {
    p_event_id: input.eventId,
    p_pass_reference: input.passReference,
    p_gate_code: input.gateCode,
    p_device_id: input.deviceId ?? null,
    p_ip_address: null,
  });

  if (!error && data) {
    const row = (typeof data === 'object' ? data : {}) as RpcValidation;
    const display = mapRpc(row);
    useScannerStore.getState().applyServerValidation(display, input.passReference);
    return display;
  }

  try {
    const { data: fnData, error: fnErr } = await supabase.functions.invoke('scanner-validate-access', {
      body: {
        eventId: input.eventId,
        passReference: input.passReference,
        gateCode: input.gateCode,
        deviceId: input.deviceId,
      },
    });
    if (!fnErr && fnData?.result) {
      const display = mapRpc(fnData.result as RpcValidation);
      useScannerStore.getState().applyServerValidation(display, input.passReference);
      return display;
    }
  } catch {
    /* réseau */
  }

  return useScannerStore.getState().validateFixture(input.passReference);
}

export async function searchAccessForScan(eventId: string, query: string): Promise<ScannerSearchHit[]> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('search_access_for_scan', { p_event_id: eventId, p_query: query });

  if (!error && data && typeof data === 'object' && 'results' in (data as object)) {
    const results = (data as unknown as { results: ScannerSearchHit[] }).results;
    return results ?? [];
  }
  return useScannerStore.getState().searchFixture(query);
}

export async function syncOfflineQueue(): Promise<number> {
  const pending = listPendingOfflineScans();
  const session = useScannerStore.getState().getSession();
  let synced = 0;
  for (const item of pending) {
    try {
      await validateAccessScan({
        eventId: item.eventId || session.eventId,
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

export const scannerService = {
  getSession: () => useScannerStore.getState().getSession(),
  setGate: (gate: ScannerGateCode) => useScannerStore.getState().setGate(gate),
  setPaused: (paused: boolean) => useScannerStore.getState().setPaused(paused),
  validateScan: validateAccessScan,
  search: searchAccessForScan,
  listHistory: () => useScannerStore.getState().listHistory(),
  liveStats: () => useScannerStore.getState().liveStats(),
  fieldAnalytics: () => useScannerStore.getState().fieldAnalytics(),
  offlinePendingCount: pendingOfflineCount,
  syncOffline: syncOfflineQueue,
};
