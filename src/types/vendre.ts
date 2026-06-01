/** Statuts billetterie (produit VENDRE). */
export type TicketingStatus =
  | 'draft'
  | 'published'
  | 'on_sale'
  | 'sold_out'
  | 'ended'
  | 'archived';

export type TicketPaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

/** Réponse serveur — ne jamais recalculer côté React. */
export interface PricingBreakdown {
  priceFcfa: number;
  commissionFcfa: number;
  organizerNetFcfa: number;
  currency: string;
}

export interface VendreTicketType {
  id: string;
  eventId: string;
  code: string;
  name: string;
  description?: string;
  priceFcfa: number;
  commissionFcfa: number;
  organizerNetFcfa: number;
  quantity: number | null;
  soldCount: number;
  isActive: boolean;
  ticketingStatus: TicketingStatus;
}

export interface PurchasedTicket {
  id: string;
  eventId: string;
  ticketTypeId: string;
  ticketTypeName: string;
  uniqueCode: string;
  accessToken: string;
  qrPayload: string;
  secureLink: string;
  buyerFirstName: string;
  buyerLastName: string;
  buyerPhone: string;
  buyerEmail?: string;
  paymentStatus: TicketPaymentStatus;
  claimed: boolean;
  claimedAt?: string;
  claimedBy?: string;
  userId?: string;
  scannedAt?: string;
  purchasedAt: string;
}

export interface VendreCheckoutInput {
  ticketTypeId: string;
  quantity: number;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

export interface VendreAnalyticsSnapshot {
  pageViews: number;
  cartAdds: number;
  purchases: number;
  conversionRate: number;
  ticketsSold: number;
  grossRevenueFcfa: number;
  organizerRevenueFcfa: number;
  invoraCommissionFcfa: number;
}

export interface VendrePromoAsset {
  key: string;
  label: string;
  description: string;
  ready: boolean;
}
