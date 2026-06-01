/** Modèle unifié Access — INVITER, VENDRE, VIP, Staff, billets, invitations. */

export type InvoraAccessUniverse = 'inviter' | 'vendre';

export type InvoraAccessStatus =
  | 'created'
  | 'distributed'
  | 'opened'
  | 'claimed'
  | 'scanned'
  | 'used'
  | 'expired'
  | 'cancelled';

export type WalletSectionTab = 'today' | 'upcoming' | 'used' | 'expired' | 'cancelled';

export type WalletNotificationKind =
  | 'access_received'
  | 'access_claimed'
  | 'access_used'
  | 'access_expired'
  | 'event_reminder';

export type WalletPassPlatform = 'apple' | 'google' | 'download';

export interface InvoraAccess {
  accessId: string;
  eventId: string;
  holderName: string;
  phone: string;
  email?: string;
  accessType: string;
  accessTypeLabel: string;
  qrCode: string;
  accessCode: string;
  status: InvoraAccessStatus;
  claimed: boolean;
  claimedAt?: string;
  claimedBy?: string;
  userId?: string;
  createdAt: string;
  universe: InvoraAccessUniverse;
  passKind: 'invitation' | 'ticket';
  publicToken: string;
  eventTitle: string;
  eventDate?: string;
  eventLocation?: string;
  instructions?: string;
  walletTab: WalletSectionTab;
  secureLink: string;
}

export interface WalletAnalyticsSnapshot {
  active: number;
  used: number;
  expired: number;
  cancelled: number;
  utilizationRate: number;
}

export interface WalletHistoryEntry {
  id: string;
  at: string;
  eventTitle: string;
  accessTypeLabel: string;
  status: InvoraAccessStatus;
  validation?: string;
  universe: InvoraAccessUniverse;
}

export interface WalletReconcileResult {
  userId: string;
  invitationsLinked: number;
  ticketsLinked: number;
}

export interface WalletNotificationPrep {
  kind: WalletNotificationKind;
  label: string;
  enabled: boolean;
}
