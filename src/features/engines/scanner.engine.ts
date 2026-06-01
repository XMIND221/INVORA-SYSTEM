import type {
  ScannerDenialReason,
  ScannerGate,
  ScannerGateCode,
  ScannerValidationDisplay,
} from '@/types/scanner';
/** Normalise le texte lu par la caméra (pas une validation métier). */
export function decodeScannedText(raw: string): string {
  return raw.trim();
}

/** Portes multi-accès — configuration terrain. */
export const SCANNER_GATES: ScannerGate[] = [
  { code: 'main', label: 'Entrée principale' },
  { code: 'vip', label: 'VIP' },
  { code: 'backstage', label: 'Backstage' },
  { code: 'press', label: 'Presse' },
  { code: 'staff', label: 'Staff' },
  { code: 'corporate', label: 'Corporate' },
];

export function gateLabel(code: ScannerGateCode): string {
  return SCANNER_GATES.find((g) => g.code === code)?.label ?? code;
}

export const DENIAL_REASON_LABELS: Record<ScannerDenialReason, string> = {
  invalid_qr: 'QR invalide',
  expired: 'Accès expiré',
  already_used: 'Déjà utilisé',
  cancelled: 'Accès annulé',
  suspended: 'Accès suspendu',
  event_ended: 'Événement terminé',
};

export function denialReasonLabel(reason?: ScannerDenialReason): string {
  if (!reason) return 'Accès refusé';
  return DENIAL_REASON_LABELS[reason];
}

export function guestDisplayName(firstName: string, lastName: string): string {
  const f = firstName?.trim();
  const l = lastName?.trim();
  if (f && l) return `${f} ${l}`;
  return f || l || 'Invité';
}

export function isValidated(display: ScannerValidationDisplay): boolean {
  return display.status === 'validated';
}

/** Hash local pour file offline (pas une validation métier). */
export function offlineQueueFingerprint(reference: string): string {
  return btoa(reference).slice(0, 24);
}
