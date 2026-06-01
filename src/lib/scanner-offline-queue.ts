import type { ScannerGateCode, ScannerOfflineQueueItem } from '@/types/scanner';

const STORAGE_KEY = 'invora_scanner_offline_v1';

function readAll(): ScannerOfflineQueueItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ScannerOfflineQueueItem[];
  } catch {
    return [];
  }
}

function writeAll(items: ScannerOfflineQueueItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function enqueueOfflineScan(input: {
  eventId: string;
  passReference: string;
  gateCode: ScannerGateCode;
  deviceId?: string;
}): ScannerOfflineQueueItem {
  const item: ScannerOfflineQueueItem = {
    id: `off-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    eventId: input.eventId,
    passReference: input.passReference,
    gateCode: input.gateCode,
    deviceId: input.deviceId,
    queuedAt: new Date().toISOString(),
  };
  writeAll([item, ...readAll()]);
  return item;
}

export function listPendingOfflineScans(): ScannerOfflineQueueItem[] {
  return readAll();
}

export function removeOfflineScan(id: string): void {
  writeAll(readAll().filter((i) => i.id !== id));
}

export function pendingOfflineCount(): number {
  return readAll().length;
}
