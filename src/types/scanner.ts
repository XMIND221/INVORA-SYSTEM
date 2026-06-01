/** Scanner Engine Pro — types UI (validation via RPC / Edge uniquement). */

export type ScannerGateCode =
  | 'main'
  | 'vip'
  | 'backstage'
  | 'press'
  | 'staff'
  | 'corporate';

export type ScannerDenialReason =
  | 'invalid_qr'
  | 'expired'
  | 'already_used'
  | 'cancelled'
  | 'suspended'
  | 'event_ended';

export type ScannerTeamRole = 'chef_scanner' | 'scanner_agent' | 'supervisor';

export type ScannerValidationStatus = 'validated' | 'denied';

export type ScannerScanResult = 'valid' | 'invalid' | 'duplicate' | 'expired';

export interface ScannerGate {
  code: ScannerGateCode;
  label: string;
}

export interface ScannerSession {
  eventId: string;
  eventTitle: string;
  gateCode: ScannerGateCode;
  agentName: string;
  teamRole: ScannerTeamRole;
}

export interface ScannerValidationDisplay {
  scanId: string;
  auditId: string;
  result: ScannerScanResult;
  status: ScannerValidationStatus;
  denialReason?: ScannerDenialReason;
  firstName: string;
  lastName: string;
  accessTypeLabel: string;
  eventTitle: string;
  gateCode: ScannerGateCode;
}

export interface ScannerHistoryEntry {
  id: string;
  at: string;
  gateCode: ScannerGateCode;
  agentName: string;
  status: ScannerValidationStatus;
  denialReason?: ScannerDenialReason;
  guestName: string;
  accessTypeLabel: string;
  passReference: string;
}

export interface ScannerSearchHit {
  passKind: 'invitation' | 'ticket';
  accessId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  uniqueCode: string | null;
  accessStatus: string;
  passReference: string;
}

export interface ScannerLiveStats {
  entered: number;
  expected: number;
  denied: number;
  presenceRate: number;
  avgValidationMs: number;
  topGate: ScannerGateCode | null;
  recentIncidents: number;
}

export interface ScannerFieldAnalytics {
  validated: number;
  denied: number;
  avgValidationMs: number;
  topGate: ScannerGateCode | null;
  peakHour: string;
  scansByGate: Record<ScannerGateCode, number>;
}

export interface ScannerOfflineQueueItem {
  id: string;
  eventId: string;
  passReference: string;
  gateCode: ScannerGateCode;
  deviceId?: string;
  queuedAt: string;
}
