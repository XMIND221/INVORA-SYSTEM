import type { InviterGuest } from '@/types/inviter';
import type {
  InvoraAccess,
  InvoraAccessStatus,
  WalletAnalyticsSnapshot,
  WalletHistoryEntry,
  WalletSectionTab,
} from '@/types/access';
import type { PurchasedTicket } from '@/types/vendre';
import { emailsMatch, phonesMatch } from './inviter.engine';
import {
  lovableInvitePublic,
  lovableTicketPublic,
} from '@/lib/constants';

const TODAY_EVENT_IDS = new Set(['obsidian-gala']);

export const ACCESS_STATUS_LABEL: Record<InvoraAccessStatus, string> = {
  created: 'Créé',
  distributed: 'Distribué',
  opened: 'Ouvert',
  claimed: 'Réclamé',
  scanned: 'Scanné',
  used: 'Utilisé',
  expired: 'Expiré',
  cancelled: 'Annulé',
};

export const WALLET_SECTION_LABEL: Record<WalletSectionTab, string> = {
  today: 'Aujourd’hui',
  upcoming: 'À venir',
  used: 'Utilisés',
  expired: 'Expirés',
  cancelled: 'Annulés',
};

export function mapGuestStatus(status: InviterGuest['status']): InvoraAccessStatus {
  if (status === 'scanned') return 'used';
  return status;
}

export function mapTicketToAccessStatus(ticket: PurchasedTicket): InvoraAccessStatus {
  if (ticket.scannedAt) return 'used';
  if (ticket.paymentStatus !== 'paid') return 'created';
  if (ticket.claimed) return 'claimed';
  return 'distributed';
}

export function walletTabForAccess(
  status: InvoraAccessStatus,
  eventId: string,
): WalletSectionTab {
  if (status === 'cancelled') return 'cancelled';
  if (status === 'expired') return 'expired';
  if (status === 'used' || status === 'scanned') return 'used';
  if (TODAY_EVENT_IDS.has(eventId)) return 'today';
  return 'upcoming';
}

export function inviterGuestToAccess(
  guest: InviterGuest,
  meta: { eventTitle: string; eventDate?: string; eventLocation?: string; accessTypeLabel: string },
): InvoraAccess {
  const status = mapGuestStatus(guest.status);
  return {
    accessId: guest.id,
    eventId: guest.eventId,
    holderName: `${guest.firstName} ${guest.lastName}`.trim(),
    phone: guest.phone,
    email: guest.email,
    accessType: guest.accessTypeCode,
    accessTypeLabel: meta.accessTypeLabel,
    qrCode: guest.qrPayload,
    accessCode: guest.uniqueCode,
    status,
    claimed: guest.claimed,
    claimedAt: guest.claimedAt,
    claimedBy: guest.claimedBy,
    userId: guest.userId,
    createdAt: guest.createdAt,
    universe: 'inviter',
    passKind: 'invitation',
    publicToken: guest.token,
    eventTitle: meta.eventTitle,
    eventDate: meta.eventDate,
    eventLocation: meta.eventLocation,
    instructions: 'Présentez votre QR à l’entrée. Compte INVORA optionnel.',
    walletTab: walletTabForAccess(status, guest.eventId),
    secureLink: guest.secureLink,
  };
}

export function ticketToAccess(
  ticket: PurchasedTicket,
  meta: { eventTitle: string; eventDate?: string; eventLocation?: string },
): InvoraAccess {
  const status = mapTicketToAccessStatus(ticket);
  return {
    accessId: ticket.id,
    eventId: ticket.eventId,
    holderName: `${ticket.buyerFirstName} ${ticket.buyerLastName}`.trim(),
    phone: ticket.buyerPhone,
    email: ticket.buyerEmail,
    accessType: ticket.ticketTypeName,
    accessTypeLabel: ticket.ticketTypeName,
    qrCode: ticket.qrPayload,
    accessCode: ticket.uniqueCode,
    status,
    claimed: ticket.claimed,
    claimedAt: ticket.claimedAt,
    claimedBy: ticket.claimedBy,
    userId: ticket.userId,
    createdAt: ticket.purchasedAt,
    universe: 'vendre',
    passKind: 'ticket',
    publicToken: ticket.accessToken,
    eventTitle: meta.eventTitle,
    eventDate: meta.eventDate,
    eventLocation: meta.eventLocation,
    instructions: 'Billet nominatif — QR unique à l’entrée.',
    walletTab: walletTabForAccess(status, ticket.eventId),
    secureLink: ticket.secureLink,
  };
}

export function groupAccessByWalletTab(
  accesses: InvoraAccess[],
): Record<WalletSectionTab, InvoraAccess[]> {
  const tabs: Record<WalletSectionTab, InvoraAccess[]> = {
    today: [],
    upcoming: [],
    used: [],
    expired: [],
    cancelled: [],
  };
  for (const a of accesses) {
    tabs[a.walletTab].push(a);
  }
  return tabs;
}

export function searchAccesses(accesses: InvoraAccess[], query: string): InvoraAccess[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return accesses.filter(
    (a) =>
      a.holderName.toLowerCase().includes(q) ||
      a.phone.toLowerCase().includes(q) ||
      (a.email?.toLowerCase().includes(q) ?? false) ||
      a.accessCode.toLowerCase().includes(q) ||
      a.eventTitle.toLowerCase().includes(q),
  );
}

export function computeWalletAnalytics(accesses: InvoraAccess[]): WalletAnalyticsSnapshot {
  const active = accesses.filter((a) =>
    ['distributed', 'opened', 'claimed'].includes(a.status),
  ).length;
  const used = accesses.filter((a) => a.status === 'used' || a.status === 'scanned').length;
  const expired = accesses.filter((a) => a.status === 'expired').length;
  const cancelled = accesses.filter((a) => a.status === 'cancelled').length;
  const total = accesses.length;
  const utilizationRate = total > 0 ? Math.round((1000 * used) / total) / 10 : 0;
  return { active, used, expired, cancelled, utilizationRate };
}

export function buildWalletHistory(accesses: InvoraAccess[]): WalletHistoryEntry[] {
  return accesses
    .map((a) => ({
      id: a.accessId,
      at: a.claimedAt ?? a.createdAt,
      eventTitle: a.eventTitle,
      accessTypeLabel: a.accessTypeLabel,
      status: a.status,
      validation: a.status === 'used' ? 'Scanné à l’entrée' : undefined,
      universe: a.universe,
    }))
    .sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime());
}

/** Réconciliation locale (fixture) — prod : RPC reconcile_user_wallet */
export function reconcileAccessesForProfile(
  accesses: InvoraAccess[],
  userId: string,
  profile: { phone?: string; email?: string },
): InvoraAccess[] {
  return accesses.map((a) => {
    if (a.userId || a.claimed) return a;
    const phoneHit = profile.phone && phonesMatch(a.phone, profile.phone);
    const emailHit = emailsMatch(a.email, profile.email);
    if (!phoneHit && !emailHit) return a;
    return {
      ...a,
      userId,
      claimed: true,
      claimedAt: a.claimedAt ?? new Date().toISOString(),
      claimedBy: userId,
      status: a.status === 'opened' || a.status === 'distributed' ? 'claimed' : a.status,
      walletTab: walletTabForAccess('claimed', a.eventId),
    };
  });
}

export function publicLinkForAccess(access: InvoraAccess): string {
  return access.passKind === 'ticket'
    ? lovableTicketPublic(access.publicToken)
    : lovableInvitePublic(access.publicToken);
}
