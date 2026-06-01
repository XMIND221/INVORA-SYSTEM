/** Statuts d’un accès INVITER (invitation). */
export type InviterAccessStatus =
  | 'created'
  | 'distributed'
  | 'opened'
  | 'claimed'
  | 'scanned'
  | 'expired'
  | 'cancelled';

export type DistributionChannel = 'whatsapp' | 'email';

export type WalletPassTab = 'today' | 'upcoming' | 'used' | 'expired' | 'cancelled';

export interface InviterAccessType {
  id: string;
  eventId: string;
  code: string;
  label: string;
  description?: string;
  maxGuests?: number;
}

export interface InviterGuest {
  id: string;
  eventId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  accessTypeCode: string;
  status: InviterAccessStatus;
  token: string;
  uniqueCode: string;
  qrPayload: string;
  secureLink: string;
  distributionChannels: DistributionChannel[];
  claimed: boolean;
  claimedAt?: string;
  claimedBy?: string;
  userId?: string;
  openedAt?: string;
  distributedAt?: string;
  scannedAt?: string;
  createdAt: string;
}

export interface InviterGuestInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  accessTypeCode: string;
}

export interface InviterDistributionInput {
  guestIds: string[];
  channels: DistributionChannel[];
}

export interface InviterAnalyticsSnapshot {
  created: number;
  sent: number;
  opened: number;
  claimed: number;
  used: number;
  attendanceRate: number;
}

export interface PublicInvitationView {
  token: string;
  eventTitle: string;
  eventDate?: string;
  eventLocation?: string;
  guestName: string;
  accessTypeLabel: string;
  uniqueCode: string;
  qrPayload: string;
  secureLink: string;
  status: InviterAccessStatus;
  claimed: boolean;
  accountRequired: false;
}
