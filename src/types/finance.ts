/** Finance INVORA — montants affichés uniquement (source : RPC / Edge). */

export type FinanceUniverse = 'inviter' | 'vendre';

export type PayoutRequestStatus = 'pending' | 'approved' | 'paid' | 'rejected';

export interface InviterPricingQuote {
  quantity: number;
  existingCount: number;
  totalFcfa: number;
  unitPriceFcfa: number;
  averageUnitFcfa?: number;
  tierLabel: string;
  nextTierHint?: string | null;
  currency: string;
}

export interface VendrePricingQuote {
  priceFcfa: number;
  quantity: number;
  clientTotalFcfa: number;
  commissionFcfa: number;
  organizerNetFcfa: number;
  commissionPerTicketFcfa: number;
  currency: string;
}

export interface BalanceSummary {
  availableFcfa: number;
  pendingFcfa: number;
  withdrawnFcfa: number;
  currency: string;
}

export interface FinanceLedgerRow {
  at: string;
  reference?: string;
  universe?: string;
  grossFcfa?: number;
  invoraCommissionFcfa?: number;
  partnerCommissionFcfa?: number;
  organizerNetFcfa?: number;
  commissionFcfa?: number;
  status?: string;
}

export interface FinanceReport {
  scope: 'organizer' | 'partner' | 'invora';
  rows: FinanceLedgerRow[];
  exportReady: boolean;
}

export interface PayoutRequest {
  id: string;
  amountFcfa: number;
  status: PayoutRequestStatus;
  requestedAt: string;
}

export interface FinanceSettlementView {
  transactionId: string;
  grossFcfa: number;
  invoraCommissionFcfa: number;
  partnerCommissionFcfa: number;
  organizerNetFcfa: number;
  frozenAt: string;
}
