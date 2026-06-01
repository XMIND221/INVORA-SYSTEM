import type { Scan } from '@/types/database';
import { parseQrPayload } from './qr.engine';

export type ScanResult = Scan['result'];

export function validateScan(input: {
  passReference: string;
  existingHashes: string[];
  expiresAt?: string;
}): ScanResult {
  const payload = parseQrPayload(input.passReference);
  if (!payload) return 'invalid';

  if (input.expiresAt && new Date(input.expiresAt) < new Date()) {
    return 'expired';
  }

  const hash = hashPassReference(input.passReference);
  if (input.existingHashes.includes(hash)) {
    return 'duplicate';
  }

  return 'valid';
}

export function hashPassReference(reference: string): string {
  return btoa(reference).slice(0, 32);
}

/** Scanner UI will use html5-qrcode — engine only validates payloads. */
export function decodeScannedText(raw: string): string {
  return raw.trim();
}
