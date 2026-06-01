import { create } from 'zustand';
import type {
  BalanceSummary,
  FinanceLedgerRow,
  FinanceReport,
  InviterPricingQuote,
  PayoutRequest,
} from '@/types/finance';
import {
  MOCK_ORGANIZER_BALANCE,
  MOCK_ORGANIZER_LEDGER,
  MOCK_ORGANIZER_PAYOUTS,
  MOCK_FINANCE_REPORT_ORGANIZER,
  fixtureInviterQuote,
} from '@/integration/lovable/finance-mock';

interface FinanceState {
  organizerBalance: BalanceSummary;
  organizerLedger: FinanceLedgerRow[];
  organizerPayouts: PayoutRequest[];
  inviterQuotes: Record<string, InviterPricingQuote>;
  reports: Record<string, FinanceReport>;

  getOrganizerBalance: () => BalanceSummary;
  getOrganizerLedger: () => FinanceLedgerRow[];
  getOrganizerPayouts: () => PayoutRequest[];
  cacheInviterQuote: (key: string, quote: InviterPricingQuote) => void;
  getInviterQuote: (key: string) => InviterPricingQuote | undefined;
  getReport: (scope: string) => FinanceReport;
  requestOrganizerPayout: (amountFcfa: number) => PayoutRequest | { error: string };
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  organizerBalance: { ...MOCK_ORGANIZER_BALANCE },
  organizerLedger: [...MOCK_ORGANIZER_LEDGER],
  organizerPayouts: [...MOCK_ORGANIZER_PAYOUTS],
  inviterQuotes: {},
  reports: { organizer: MOCK_FINANCE_REPORT_ORGANIZER },

  getOrganizerBalance: () => get().organizerBalance,
  getOrganizerLedger: () => get().organizerLedger,
  getOrganizerPayouts: () => get().organizerPayouts,

  cacheInviterQuote: (key, quote) =>
    set((s) => ({ inviterQuotes: { ...s.inviterQuotes, [key]: quote } })),

  getInviterQuote: (key) => get().inviterQuotes[key],

  getReport: (scope) => get().reports[scope] ?? MOCK_FINANCE_REPORT_ORGANIZER,

  requestOrganizerPayout: (amountFcfa) => {
    const bal = get().organizerBalance;
    if (amountFcfa > bal.availableFcfa) return { error: 'insufficient_balance' };
    const req: PayoutRequest = {
      id: `op-${Date.now()}`,
      amountFcfa,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    set((s) => ({
      organizerPayouts: [req, ...s.organizerPayouts],
      organizerBalance: {
        ...s.organizerBalance,
        availableFcfa: s.organizerBalance.availableFcfa - amountFcfa,
        pendingFcfa: s.organizerBalance.pendingFcfa + amountFcfa,
      },
    }));
    return req;
  },
}));

export function previewInviterQuoteFixture(quantity: number, existing: number): InviterPricingQuote {
  return fixtureInviterQuote(quantity, existing);
}
