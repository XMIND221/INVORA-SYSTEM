import type {
  BalanceSummary,
  FinanceLedgerRow,
  FinanceReport,
  InviterPricingQuote,
  PayoutRequest,
  VendrePricingQuote,
} from '@/types/finance';
import { fixturePricingForPrice } from '@/integration/lovable/vendre-mock';

/** Fixtures offline — alignées sur RPC Phase 9. */
export function fixtureInviterQuote(quantity: number, existingCount: number): InviterPricingQuote {
  let total = 0;
  for (let i = 1; i <= quantity; i++) {
    total += unitFixture(existingCount + i);
  }
  const unit = unitFixture(existingCount + 1);
  const next = nextHintFixture(existingCount + quantity);
  return {
    quantity,
    existingCount,
    totalFcfa: total,
    unitPriceFcfa: unit,
    averageUnitFcfa: quantity > 0 ? Math.round(total / quantity) : unit,
    tierLabel: tierLabelFixture(existingCount + 1),
    nextTierHint: next,
    currency: 'XOF',
  };
}

function unitFixture(index: number): number {
  if (index >= 501) return 300;
  if (index >= 301) return 550;
  if (index >= 151) return 650;
  if (index >= 100) return 750;
  if (index >= 31) return 850;
  if (index >= 16) return 900;
  return 950;
}

function tierLabelFixture(index: number): string {
  if (index >= 501) return '501+';
  if (index >= 301) return '301–500';
  if (index >= 151) return '151–300';
  if (index >= 100) return '100–150';
  if (index >= 31) return '31–99';
  if (index >= 16) return '16–30';
  return '1–15';
}

function nextHintFixture(after: number): string | null {
  const th =
    after < 15 ? 16 : after < 30 ? 31 : after < 99 ? 100 : after < 150 ? 151 : after < 300 ? 301 : after < 500 ? 501 : null;
  if (!th) return null;
  const until = th - after;
  if (until <= 0) return null;
  return `Encore ${until} accès pour débloquer ${unitFixture(th)} FCFA.`;
}

export function fixtureVendreQuote(priceFcfa: number, quantity = 1): VendrePricingQuote {
  const p = fixturePricingForPrice(priceFcfa);
  return {
    priceFcfa: p.priceFcfa,
    quantity,
    clientTotalFcfa: p.priceFcfa * quantity,
    commissionFcfa: p.commissionFcfa,
    organizerNetFcfa: p.organizerNetFcfa,
    commissionPerTicketFcfa: p.commissionFcfa,
    currency: p.currency,
  };
}

export const MOCK_ORGANIZER_BALANCE: BalanceSummary = {
  availableFcfa: 1_240_000,
  pendingFcfa: 84_050,
  withdrawnFcfa: 3_200_000,
  currency: 'XOF',
};

export const MOCK_ORGANIZER_LEDGER: FinanceLedgerRow[] = [
  {
    at: '2026-01-12T10:00:00Z',
    reference: 'TX-SHOW-212',
    universe: 'vendre',
    grossFcfa: 250_000,
    invoraCommissionFcfa: 10_000,
    partnerCommissionFcfa: 600,
    organizerNetFcfa: 239_400,
    status: 'paid',
  },
  {
    at: '2026-01-10T09:00:00Z',
    reference: 'TX-OBS-INV',
    universe: 'inviter',
    grossFcfa: 47_500,
    invoraCommissionFcfa: 47_500,
    organizerNetFcfa: 0,
    status: 'paid',
  },
];

export const MOCK_ORGANIZER_PAYOUTS: PayoutRequest[] = [
  { id: 'op-1', amountFcfa: 500_000, status: 'paid', requestedAt: '2026-01-05T08:00:00Z' },
  { id: 'op-2', amountFcfa: 84_050, status: 'pending', requestedAt: '2026-01-14T11:00:00Z' },
];

export const MOCK_FINANCE_REPORT_ORGANIZER: FinanceReport = {
  scope: 'organizer',
  rows: MOCK_ORGANIZER_LEDGER,
  exportReady: true,
};
