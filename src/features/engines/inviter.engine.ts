import { buildInvitationShareUrl, isInvitationUniverse } from './invitation.engine';
import { generateQrPayload } from './qr.engine';
import type {
  DistributionChannel,
  InviterAccessStatus,
  InviterAnalyticsSnapshot,
  InviterGuest,
  InviterGuestInput,
  WalletPassTab,
} from '@/types/inviter';
import type { EventUniverse } from '@/types/event';

export const INVITER_ACCESS_STATUSES: InviterAccessStatus[] = [
  'created',
  'distributed',
  'opened',
  'claimed',
  'scanned',
  'expired',
  'cancelled',
];

export const INVITER_STATUS_LABEL: Record<InviterAccessStatus, string> = {
  created: 'Créé',
  distributed: 'Distribué',
  opened: 'Ouvert',
  claimed: 'Réclamé',
  scanned: 'Scanné',
  expired: 'Expiré',
  cancelled: 'Annulé',
};

const STATUS_TRANSITIONS: Record<InviterAccessStatus, InviterAccessStatus[]> = {
  created: ['distributed', 'cancelled'],
  distributed: ['opened', 'claimed', 'cancelled', 'expired'],
  opened: ['claimed', 'scanned', 'cancelled', 'expired'],
  claimed: ['scanned', 'cancelled', 'expired'],
  scanned: [],
  expired: [],
  cancelled: [],
};

export function validateGuestInput(input: InviterGuestInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!input.firstName?.trim()) errors.push('first_name_required');
  if (!input.lastName?.trim()) errors.push('last_name_required');
  if (!input.phone?.trim()) errors.push('phone_required');
  if (!input.accessTypeCode?.trim()) errors.push('access_type_required');
  return { valid: errors.length === 0, errors };
}

export function canTransitionStatus(
  from: InviterAccessStatus,
  to: InviterAccessStatus,
): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

export function generateUniqueAccessCode(eventId: string): string {
  const suffix = crypto.randomUUID().split('-')[0]!.toUpperCase();
  const short = eventId.replace(/-/g, '').slice(0, 6).toUpperCase();
  return `INV-${short}-${suffix}`;
}

export function generateGuestToken(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export function buildGuestSecureLink(baseUrl: string, token: string): string {
  return buildInvitationShareUrl(baseUrl, token);
}

export function buildGuestQrPayload(eventId: string, guestId: string, token: string): string {
  return generateQrPayload({
    type: 'invitation',
    eventId,
    referenceId: guestId,
    token,
  });
}

export function createGuestRecord(
  eventId: string,
  input: InviterGuestInput,
  baseUrl: string,
): InviterGuest {
  const id = crypto.randomUUID();
  const token = generateGuestToken();
  const uniqueCode = generateUniqueAccessCode(eventId);
  const qrPayload = buildGuestQrPayload(eventId, id, token);
  const secureLink = buildGuestSecureLink(baseUrl, token);

  return {
    id,
    eventId,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone: normalizePhone(input.phone),
    email: input.email?.trim() || undefined,
    accessTypeCode: input.accessTypeCode,
    status: 'created',
    token,
    uniqueCode,
    qrPayload,
    secureLink,
    distributionChannels: [],
    claimed: false,
    createdAt: new Date().toISOString(),
  };
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\s/g, '').trim();
}

export function phonesMatch(a: string, b: string): boolean {
  return normalizePhone(a) === normalizePhone(b);
}

export function emailsMatch(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/** Réconciliation pure : rattache les accès non assignés à un userId. */
export function reconcileGuestsForUser(
  guests: InviterGuest[],
  userId: string,
  profile: { phone?: string; email?: string },
): InviterGuest[] {
  return guests.map((g) => {
    if (g.userId || g.claimed) return g;
    const phoneHit = profile.phone && phonesMatch(g.phone, profile.phone);
    const emailHit = emailsMatch(g.email, profile.email);
    if (!phoneHit && !emailHit) return g;

    return {
      ...g,
      userId,
      claimed: true,
      claimedAt: g.claimedAt ?? new Date().toISOString(),
      claimedBy: userId,
      status: canTransitionStatus(g.status, 'claimed') ? 'claimed' : g.status,
    };
  });
}

export function applyDistribution(
  guest: InviterGuest,
  channels: DistributionChannel[],
): InviterGuest {
  const merged = [...new Set([...guest.distributionChannels, ...channels])];
  const nextStatus = canTransitionStatus(guest.status, 'distributed') ? 'distributed' : guest.status;
  return {
    ...guest,
    status: nextStatus,
    distributionChannels: merged,
    distributedAt: guest.distributedAt ?? new Date().toISOString(),
  };
}

export function markGuestOpened(guest: InviterGuest): InviterGuest {
  const next = canTransitionStatus(guest.status, 'opened') ? 'opened' : guest.status;
  return {
    ...guest,
    status: next,
    openedAt: guest.openedAt ?? new Date().toISOString(),
  };
}

export function claimGuest(guest: InviterGuest, userId: string): InviterGuest {
  if (guest.claimed && guest.userId && guest.userId !== userId) {
    throw new Error('already_claimed_other_user');
  }
  const next = canTransitionStatus(guest.status, 'claimed') ? 'claimed' : guest.status;
  return {
    ...guest,
    claimed: true,
    claimedAt: guest.claimedAt ?? new Date().toISOString(),
    claimedBy: userId,
    userId,
    status: next,
  };
}

export function markGuestScanned(guest: InviterGuest): InviterGuest {
  return {
    ...guest,
    status: 'scanned',
    scannedAt: new Date().toISOString(),
  };
}

export function computeInviterAnalytics(guests: InviterGuest[]): InviterAnalyticsSnapshot {
  const created = guests.length;
  const sent = guests.filter((g) =>
    ['distributed', 'opened', 'claimed', 'scanned'].includes(g.status),
  ).length;
  const opened = guests.filter((g) =>
    ['opened', 'claimed', 'scanned'].includes(g.status),
  ).length;
  const claimed = guests.filter((g) => g.claimed).length;
  const used = guests.filter((g) => g.status === 'scanned').length;
  const attendanceRate = sent > 0 ? Math.round((used / sent) * 100) : 0;

  return { created, sent, opened, claimed, used, attendanceRate };
}

export function walletTabForGuest(guest: InviterGuest): WalletPassTab {
  if (guest.status === 'cancelled') return 'cancelled';
  if (guest.status === 'expired') return 'expired';
  if (guest.status === 'scanned') return 'used';
  if (guest.eventId === 'obsidian-gala') return 'today';
  return 'upcoming';
}

export function assertInviterUniverse(universe: EventUniverse): void {
  if (!isInvitationUniverse(universe)) {
    throw new Error('not_inviter_universe');
  }
}

export function buildWhatsAppShareText(guest: InviterGuest, eventTitle: string): string {
  return `Votre accès INVORA — ${eventTitle}\nCode : ${guest.uniqueCode}\n${guest.secureLink}`;
}

export function buildEmailShareSubject(eventTitle: string): string {
  return `Votre accès — ${eventTitle}`;
}
