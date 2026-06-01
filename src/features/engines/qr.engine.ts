import QRCode from 'qrcode';

export type QrPassType = 'invitation' | 'ticket' | 'access';

export interface QrPayloadInput {
  type: QrPassType;
  eventId: string;
  referenceId: string;
  token?: string;
}

export interface QrPayload {
  v: 1;
  type: QrPassType;
  eventId: string;
  referenceId: string;
  token?: string;
  issuedAt: string;
}

export function generateQrPayload(input: QrPayloadInput): string {
  const payload: QrPayload = {
    v: 1,
    type: input.type,
    eventId: input.eventId,
    referenceId: input.referenceId,
    issuedAt: new Date().toISOString(),
  };
  if (input.token) payload.token = input.token;
  return btoa(JSON.stringify(payload));
}

export function parseQrPayload(encoded: string): QrPayload | null {
  try {
    const parsed = JSON.parse(atob(encoded)) as QrPayload;
    if (parsed.v !== 1 || !parsed.eventId || !parsed.referenceId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function renderQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, { errorCorrectionLevel: 'H', margin: 2 });
}
