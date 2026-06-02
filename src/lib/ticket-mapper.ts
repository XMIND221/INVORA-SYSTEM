import { lovableTicketPublic } from '@/lib/constants';
import type { InvoraAccess, InvoraAccessStatus, WalletSectionTab } from '@/types/access';
import type { PurchasedTicket, VendreTicketType } from '@/types/vendre';

export interface PublicTicketView {
  ticket: PurchasedTicket;
  eventTitle: string;
  eventLocation?: string;
  eventStartsAt?: string;
  eventEndsAt?: string;
  eventCoverUrl?: string;
}

type RpcTicketRow = {
  id: string;
  eventId: string;
  ticketTypeId: string;
  ticketTypeName: string;
  uniqueCode: string;
  accessToken: string;
  qrPayload: string;
  buyerFirstName?: string;
  buyerLastName?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  paymentStatus: string;
  status: string;
  claimed: boolean;
  claimedAt?: string;
  claimedBy?: string;
  userId?: string;
  scannedAt?: string;
  purchasedAt: string;
  transactionId?: string;
};

type RpcEventRow = {
  id: string;
  title: string;
  location?: string;
  startsAt?: string;
  endsAt?: string;
  coverUrl?: string;
};

export function mapRpcToPurchasedTicket(row: RpcTicketRow): PurchasedTicket {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return {
    id: row.id,
    eventId: row.eventId,
    ticketTypeId: row.ticketTypeId,
    ticketTypeName: row.ticketTypeName,
    uniqueCode: row.uniqueCode,
    accessToken: row.accessToken,
    qrPayload: row.qrPayload,
    secureLink: `${origin}${lovableTicketPublic(row.accessToken)}`,
    buyerFirstName: row.buyerFirstName ?? '',
    buyerLastName: row.buyerLastName ?? '',
    buyerPhone: row.buyerPhone ?? '',
    buyerEmail: row.buyerEmail,
    paymentStatus: row.paymentStatus as PurchasedTicket['paymentStatus'],
    claimed: row.claimed,
    claimedAt: row.claimedAt,
    claimedBy: row.claimedBy,
    userId: row.userId,
    scannedAt: row.scannedAt,
    purchasedAt: row.purchasedAt,
  };
}

export function mapPublicTicketPayload(data: {
  ticket: RpcTicketRow;
  event: RpcEventRow;
}): PublicTicketView {
  return {
    ticket: mapRpcToPurchasedTicket(data.ticket),
    eventTitle: data.event.title,
    eventLocation: data.event.location,
    eventStartsAt: data.event.startsAt,
    eventEndsAt: data.event.endsAt,
    eventCoverUrl: data.event.coverUrl,
  };
}

export function mapTicketTypeRow(row: {
  id: string;
  eventId: string;
  code?: string;
  name: string;
  description?: string;
  priceFcfa: number;
  commissionFcfa?: number;
  organizerNetFcfa?: number;
  quantity: number | null;
  soldCount: number;
  isActive: boolean;
  ticketingStatus: string;
}): VendreTicketType {
  return {
    id: row.id,
    eventId: row.eventId,
    code: row.code ?? row.name.toLowerCase().replace(/\s+/g, '_'),
    name: row.name,
    description: row.description,
    priceFcfa: row.priceFcfa,
    commissionFcfa: row.commissionFcfa ?? 0,
    organizerNetFcfa: row.organizerNetFcfa ?? row.priceFcfa,
    quantity: row.quantity,
    soldCount: row.soldCount,
    isActive: row.isActive,
    ticketingStatus: row.ticketingStatus as VendreTicketType['ticketingStatus'],
  };
}

export type WalletUnifiedRow = {
  access_id: string;
  event_id: string;
  event_title: string;
  event_starts_at: string | null;
  event_location: string | null;
  holder_name: string;
  phone: string | null;
  email: string | null;
  access_type: string;
  qr_code: string;
  access_code: string;
  status: InvoraAccessStatus;
  claimed: boolean;
  claimed_at: string | null;
  claimed_by: string | null;
  user_id: string | null;
  created_at: string;
  universe: 'inviter' | 'vendre';
  pass_kind: string;
  public_token: string;
};

function walletTabForRow(row: WalletUnifiedRow): WalletSectionTab {
  if (row.status === 'cancelled') return 'cancelled';
  if (row.status === 'expired') return 'expired';
  if (row.status === 'used' || row.status === 'scanned') return 'used';
  if (row.event_starts_at) {
    const start = new Date(row.event_starts_at);
    const now = new Date();
    const sameDay =
      start.getFullYear() === now.getFullYear() &&
      start.getMonth() === now.getMonth() &&
      start.getDate() === now.getDate();
    if (sameDay && start <= now) return 'today';
    if (start > now) return 'upcoming';
    if (start < now) return 'used';
  }
  return 'upcoming';
}

export function mapWalletRowToAccess(row: WalletUnifiedRow): InvoraAccess {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const tab = walletTabForRow(row);
  const secureLink =
    row.pass_kind === 'ticket'
      ? `${origin}${lovableTicketPublic(row.public_token)}`
      : `${origin}/invite/${row.public_token}`;

  return {
    accessId: row.access_id,
    eventId: row.event_id,
    holderName: row.holder_name,
    phone: row.phone ?? '',
    email: row.email ?? undefined,
    accessType: row.access_type,
    accessTypeLabel: row.access_type,
    qrCode: row.qr_code,
    accessCode: row.access_code,
    status: row.status,
    claimed: row.claimed,
    claimedAt: row.claimed_at ?? undefined,
    claimedBy: row.claimed_by ?? undefined,
    userId: row.user_id ?? undefined,
    createdAt: row.created_at,
    universe: row.universe,
    passKind: row.pass_kind === 'ticket' ? 'ticket' : 'invitation',
    publicToken: row.public_token,
    eventTitle: row.event_title,
    eventDate: row.event_starts_at ?? undefined,
    eventLocation: row.event_location ?? undefined,
    walletTab: tab,
    secureLink,
  };
}
