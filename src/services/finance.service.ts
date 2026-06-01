import { supabase } from '@/supabase/client';
import {
  fixtureInviterQuote,
  fixtureVendreQuote,
  MOCK_ORGANIZER_BALANCE,
} from '@/integration/lovable/finance-mock';
import { useFinanceStore } from '@/store/finance.store';
import type {
  BalanceSummary,
  FinanceReport,
  InviterPricingQuote,
  PayoutRequest,
  VendrePricingQuote,
} from '@/types/finance';
import { fetchPricingFromServer } from '@/services/vendre.service';

export async function fetchInviterPricingQuote(
  quantity: number,
  existingCount: number,
): Promise<InviterPricingQuote> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('calculate_inviter_pricing_quote', {
    p_quantity: quantity,
    p_existing_count: existingCount,
  });

  if (!error && data && typeof data === 'object') {
    const row = data as Record<string, unknown>;
    const quote: InviterPricingQuote = {
      quantity: Number(row.quantity ?? quantity),
      existingCount: Number(row.existingCount ?? existingCount),
      totalFcfa: Number(row.totalFcfa ?? 0),
      unitPriceFcfa: Number(row.unitPriceFcfa ?? 0),
      averageUnitFcfa: row.averageUnitFcfa != null ? Number(row.averageUnitFcfa) : undefined,
      tierLabel: String(row.tierLabel ?? ''),
      nextTierHint: row.nextTierHint != null ? String(row.nextTierHint) : null,
      currency: String(row.currency ?? 'XOF'),
    };
    const key = `${existingCount}-${quantity}`;
    useFinanceStore.getState().cacheInviterQuote(key, quote);
    return quote;
  }

  const quote = fixtureInviterQuote(quantity, existingCount);
  useFinanceStore.getState().cacheInviterQuote(`${existingCount}-${quantity}`, quote);
  return quote;
}

export async function fetchVendrePricingQuote(
  priceFcfa: number,
  quantity = 1,
): Promise<VendrePricingQuote> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('calculate_vendre_pricing_quote', {
    p_price_fcfa: priceFcfa,
    p_quantity: quantity,
  });

  if (!error && data && typeof data === 'object') {
    const row = data as Record<string, unknown>;
    return {
      priceFcfa: Number(row.priceFcfa ?? priceFcfa),
      quantity: Number(row.quantity ?? quantity),
      clientTotalFcfa: Number(row.clientTotalFcfa ?? 0),
      commissionFcfa: Number(row.commissionFcfa ?? 0),
      organizerNetFcfa: Number(row.organizerNetFcfa ?? 0),
      commissionPerTicketFcfa: Number(row.commissionPerTicketFcfa ?? 0),
      currency: String(row.currency ?? 'XOF'),
    };
  }

  try {
    const { data: fnData, error: fnErr } = await supabase.functions.invoke('calculate-finance-quote', {
      body: { type: 'vendre', priceFcfa, quantity },
    });
    if (!fnErr && fnData?.quote) {
      return fnData.quote as VendrePricingQuote;
    }
  } catch {
    /* offline */
  }

  const breakdown = await fetchPricingFromServer(priceFcfa);
  return fixtureVendreQuote(breakdown.priceFcfa, quantity);
}

export async function fetchOrganizerBalance(): Promise<BalanceSummary> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('get_organizer_balance_summary', {});

  if (!error && data && typeof data === 'object') {
    const row = data as Record<string, unknown>;
    return {
      availableFcfa: Number(row.availableFcfa ?? 0),
      pendingFcfa: Number(row.pendingFcfa ?? 0),
      withdrawnFcfa: Number(row.withdrawnFcfa ?? 0),
      currency: String(row.currency ?? 'XOF'),
    };
  }
  return MOCK_ORGANIZER_BALANCE;
}

export async function fetchFinanceReport(
  scope: 'organizer' | 'partner' | 'invora',
  eventId?: string,
): Promise<FinanceReport> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('get_finance_report', { p_scope: scope, p_event_id: eventId ?? null });

  if (!error && data && typeof data === 'object') {
    const row = data as { scope: string; rows: FinanceReport['rows']; exportReady: boolean };
    return {
      scope: scope,
      rows: row.rows ?? [],
      exportReady: Boolean(row.exportReady),
    };
  }
  return useFinanceStore.getState().getReport(scope);
}

export async function requestOrganizerPayout(amountFcfa: number): Promise<PayoutRequest | { error: string }> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('create_organizer_payout_request', { p_amount_fcfa: amountFcfa });

  if (!error && data) {
    return {
      id: String(data),
      amountFcfa,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
  }
  return useFinanceStore.getState().requestOrganizerPayout(amountFcfa);
}

export const financeService = {
  inviterQuote: fetchInviterPricingQuote,
  vendreQuote: fetchVendrePricingQuote,
  organizerBalance: fetchOrganizerBalance,
  organizerLedger: () => useFinanceStore.getState().getOrganizerLedger(),
  organizerPayouts: () => useFinanceStore.getState().getOrganizerPayouts(),
  report: fetchFinanceReport,
  requestPayout: requestOrganizerPayout,
};
