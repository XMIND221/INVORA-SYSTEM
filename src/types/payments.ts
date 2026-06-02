/** Phase 10 — Payments & Checkout (affichage uniquement, vérité = RPC/Edge) */

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'expired'
  | 'cancelled'
  | 'refunded'
  | 'disputed';

export type CheckoutUniverse =
  | 'inviter'
  | 'vendre'
  | 'organizer'
  | 'guest'
  | 'ticketing'
  | 'service';

export type RefundStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface PaymentProvider {
  id: string;
  displayName: string;
  providerType: 'card' | 'mobile_money' | 'wallet' | 'aggregator';
  isActive: boolean;
  phase: 1 | 2;
}

export interface CheckoutInitResult {
  transactionId: string;
  paymentAttemptId: string;
  amountFcfa: number;
  currency: string;
  checkoutUrl: string;
  expiresAt?: string;
  quote?: Record<string, unknown>;
}

export interface PaymentAttemptView {
  id: string;
  transactionId: string;
  universe: CheckoutUniverse;
  providerId: string;
  amountFcfa: number;
  currency: string;
  paymentStatus: PaymentStatus;
  checkoutUrl?: string;
  expiresAt?: string;
}

export interface PaymentConfirmResult {
  status: PaymentStatus;
  paymentId?: string;
  paymentAttemptId: string;
  transactionId: string;
  settlementId?: string;
  universe?: CheckoutUniverse;
  idempotent?: boolean;
}

export interface ReconciliationResult {
  paymentAttemptId: string;
  transactionId?: string;
  expectedFcfa: number;
  receivedFcfa: number;
  deltaFcfa: number;
  attemptStatus: PaymentStatus;
  paymentStatus: string;
  provider: string;
  providerRef?: string;
  reconciled: boolean;
  primaryTicketToken?: string;
  ticketTokens?: { id: string; accessToken: string; uniqueCode: string; paymentStatus: string }[];
}

export interface RefundRequest {
  paymentId: string;
  amountFcfa: number;
  reason?: string;
  isPartial?: boolean;
}

export type PaymentNotificationKind =
  | 'payment_received'
  | 'payment_failed'
  | 'payment_refunded'
  | 'payout_approved'
  | 'payout_rejected';
