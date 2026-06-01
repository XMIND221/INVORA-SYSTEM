import type { EventUniverse } from '@/types/event';
import type {
  PurchasedTicket,
  TicketingStatus,
  TicketPaymentStatus,
  VendreAnalyticsSnapshot,
  VendreCheckoutInput,
  VendreTicketType,
} from '@/types/vendre';
import { isTicketingUniverse, canPurchase, remainingStock } from './ticket.engine';
import { generateQrPayload } from './qr.engine';

export const TICKETING_STATUS_LABEL: Record<TicketingStatus, string> = {
  draft: 'Brouillon',
  published: 'Publié',
  on_sale: 'En vente',
  sold_out: 'Épuisé',
  ended: 'Terminé',
  archived: 'Archivé',
};

export const TICKET_PRESETS = [
  { code: 'standard', name: 'Standard' },
  { code: 'vip', name: 'VIP' },
  { code: 'premium', name: 'Premium' },
  { code: 'backstage', name: 'Backstage' },
  { code: 'corporate', name: 'Corporate' },
  { code: 'custom', name: 'Custom' },
] as const;

export function assertVendreUniverse(universe: EventUniverse): void {
  if (!isTicketingUniverse(universe)) {
    throw new Error('not_vendre_universe');
  }
}

export function validateCheckoutInput(input: VendreCheckoutInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!input.ticketTypeId) errors.push('ticket_type_required');
  if (!input.quantity || input.quantity < 1) errors.push('quantity_invalid');
  if (!input.firstName?.trim()) errors.push('first_name_required');
  if (!input.lastName?.trim()) errors.push('last_name_required');
  if (!input.phone?.trim()) errors.push('phone_required');
  return { valid: errors.length === 0, errors };
}

export function canValidateTicketScan(ticket: Pick<PurchasedTicket, 'paymentStatus'>): boolean {
  return ticket.paymentStatus === 'paid';
}

export function canIssueTicketAccess(ticket: Pick<PurchasedTicket, 'paymentStatus'>): boolean {
  return ticket.paymentStatus === 'paid';
}

export function isTicketTypePurchasable(
  type: VendreTicketType,
  ticketingStatus: TicketingStatus,
): boolean {
  if (ticketingStatus !== 'on_sale' && ticketingStatus !== 'published') return false;
  const stock = type.quantity === null ? null : Math.max(0, type.quantity - type.soldCount);
  return type.isActive && (stock === null || stock > 0);
}

export function buildTicketSecureLink(baseUrl: string, token: string): string {
  return `${baseUrl}/ticket/${token}`;
}

export function generateTicketAccessToken(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export function generateTicketUniqueCode(eventId: string): string {
  const suffix = crypto.randomUUID().split('-')[0]!.toUpperCase();
  return `TKT-${eventId.replace(/-/g, '').slice(0, 6).toUpperCase()}-${suffix}`;
}

export function createPurchasedTicketRecord(
  eventId: string,
  type: VendreTicketType,
  input: VendreCheckoutInput,
  baseUrl: string,
  paymentStatus: TicketPaymentStatus,
  _transactionId: string,
): PurchasedTicket {
  const id = crypto.randomUUID();
  const accessToken = generateTicketAccessToken();
  const uniqueCode = generateTicketUniqueCode(eventId);
  const qrPayload = generateQrPayload({
    type: 'ticket',
    eventId,
    referenceId: id,
    token: accessToken,
  });

  return {
    id,
    eventId,
    ticketTypeId: type.id,
    ticketTypeName: type.name,
    uniqueCode,
    accessToken,
    qrPayload,
    secureLink: buildTicketSecureLink(baseUrl, accessToken),
    buyerFirstName: input.firstName.trim(),
    buyerLastName: input.lastName.trim(),
    buyerPhone: input.phone.replace(/\s/g, '').trim(),
    buyerEmail: input.email?.trim(),
    paymentStatus,
    claimed: false,
    purchasedAt: new Date().toISOString(),
  };
}

export function claimTicketRecord(ticket: PurchasedTicket, userId: string): PurchasedTicket {
  if (ticket.paymentStatus !== 'paid') throw new Error('payment_required');
  if (ticket.claimed && ticket.userId && ticket.userId !== userId) {
    throw new Error('already_claimed_other_user');
  }
  return {
    ...ticket,
    claimed: true,
    claimedAt: ticket.claimedAt ?? new Date().toISOString(),
    claimedBy: userId,
    userId,
  };
}

export function reconcileTicketsForUser(
  tickets: PurchasedTicket[],
  userId: string,
  profile: { phone?: string; email?: string },
): PurchasedTicket[] {
  return tickets.map((t) => {
    if (t.userId || t.paymentStatus !== 'paid') return t;
    const phoneHit = profile.phone && t.buyerPhone === profile.phone.replace(/\s/g, '').trim();
    const emailHit =
      profile.email &&
      t.buyerEmail &&
      profile.email.toLowerCase() === t.buyerEmail.toLowerCase();
    if (!phoneHit && !emailHit) return t;
    return claimTicketRecord(t, userId);
  });
}

export function computeVendreAnalytics(
  types: VendreTicketType[],
  tickets: PurchasedTicket[],
  metrics: { pageViews: number; cartAdds: number },
): VendreAnalyticsSnapshot {
  const paid = tickets.filter((t) => t.paymentStatus === 'paid');
  const ticketsSold = paid.length;
  const grossRevenueFcfa = paid.reduce((s, t) => {
    const type = types.find((x) => x.id === t.ticketTypeId);
    return s + (type?.priceFcfa ?? 0);
  }, 0);
  const invoraCommissionFcfa = paid.reduce((s, t) => {
    const type = types.find((x) => x.id === t.ticketTypeId);
    return s + (type?.commissionFcfa ?? 0);
  }, 0);
  const organizerRevenueFcfa = paid.reduce((s, t) => {
    const type = types.find((x) => x.id === t.ticketTypeId);
    return s + (type?.organizerNetFcfa ?? 0);
  }, 0);
  const purchases = new Set(paid.map((t) => t.accessToken)).size;
  const conversionRate =
    metrics.pageViews > 0 ? Math.round((purchases / metrics.pageViews) * 100) : 0;

  return {
    pageViews: metrics.pageViews,
    cartAdds: metrics.cartAdds,
    purchases,
    conversionRate,
    ticketsSold,
    grossRevenueFcfa,
    organizerRevenueFcfa,
    invoraCommissionFcfa,
  };
}

export function getVendrePromoAssets(): import('@/types/vendre').VendrePromoAsset[] {
  return [
    { key: 'poster', label: 'Affiche', description: 'A3 & digital — Design Engine', ready: true },
    { key: 'story', label: 'Story', description: '9:16 billetterie', ready: true },
    { key: 'publication', label: 'Publication', description: 'Texte + visuel réseaux', ready: true },
    { key: 'qr', label: 'QR promotionnel', description: 'Vers la page publique', ready: true },
    { key: 'link', label: 'Lien partageable', description: 'URL billetterie', ready: true },
    { key: 'mediakit', label: 'Media Kit', description: 'Pour partenaires RAYONNER', ready: false },
  ];
}

/** Map DB ticket type shape for stock checks (non-financial). */
export function mapVendreTypeToDb(type: VendreTicketType) {
  return {
    quantity: type.quantity,
    sold_count: type.soldCount,
    is_active: type.isActive,
    price_cents: type.priceFcfa,
  };
}

export { canPurchase, remainingStock };
