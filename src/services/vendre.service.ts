import { supabase } from '@/supabase/client';
import { useVendreStore } from '@/store/vendre.store';
import type {
  PricingBreakdown,
  VendreAnalyticsSnapshot,
  VendreCheckoutInput,
  PurchasedTicket,
  VendreTicketType,
  TicketingStatus,
} from '@/types/vendre';
import { fixturePricingForPrice } from '@/integration/lovable/vendre-mock';

type RpcPricingRow = {
  price_fcfa: number;
  commission_fcfa: number;
  organizer_net_fcfa: number;
  currency: string;
};

function mapPricingRow(row: RpcPricingRow): PricingBreakdown {
  return {
    priceFcfa: row.price_fcfa,
    commissionFcfa: row.commission_fcfa,
    organizerNetFcfa: row.organizer_net_fcfa,
    currency: row.currency,
  };
}

/**
 * Tarification — uniquement via RPC / Edge Function (jamais de formule en React).
 */
export async function fetchPricingFromServer(priceFcfa: number): Promise<PricingBreakdown> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, number>) => ReturnType<typeof supabase.rpc>
  )('calculate_invora_commission', { p_price_fcfa: priceFcfa });

  if (!error && data) {
    const row = (Array.isArray(data) ? data[0] : data) as RpcPricingRow;
    if (row) return mapPricingRow(row);
  }

  try {
    const { data: fnData, error: fnErr } = await supabase.functions.invoke('calculate-pricing', {
      body: { priceFcfa },
    });
    if (!fnErr && fnData?.pricing) {
      const p = fnData.pricing as RpcPricingRow;
      return mapPricingRow(p);
    }
  } catch {
    /* offline */
  }

  return fixturePricingForPrice(priceFcfa);
}

export const vendreService = {
  initEvent(eventId: string): void {
    useVendreStore.getState().initEvent(eventId);
  },

  listTicketTypes(eventId: string): VendreTicketType[] {
    return useVendreStore.getState().listTicketTypes(eventId);
  },

  getTicketingStatus(eventId: string): TicketingStatus {
    return useVendreStore.getState().getTicketingStatus(eventId);
  },

  async fetchPricing(priceFcfa: number): Promise<PricingBreakdown> {
    return fetchPricingFromServer(priceFcfa);
  },

  async addTicketType(
    eventId: string,
    input: {
      code: string;
      name: string;
      description?: string;
      priceFcfa: number;
      quantity: number | null;
    },
  ): Promise<VendreTicketType> {
    const pricing = await fetchPricingFromServer(input.priceFcfa);
    return useVendreStore.getState().addTicketType(eventId, {
      code: input.code,
      name: input.name,
      description: input.description,
      priceFcfa: input.priceFcfa,
      commissionFcfa: pricing.commissionFcfa,
      organizerNetFcfa: pricing.organizerNetFcfa,
      quantity: input.quantity,
      isActive: true,
      ticketingStatus: 'draft',
    });
  },

  publishTicketing(eventId: string): void {
    useVendreStore.getState().publishTicketing(eventId);
  },

  startSale(eventId: string): void {
    useVendreStore.getState().startSale(eventId);
  },

  recordPageView(eventId: string): void {
    useVendreStore.getState().recordPageView(eventId);
  },

  recordCartAdd(eventId: string): void {
    useVendreStore.getState().recordCartAdd(eventId);
  },

  checkout(eventId: string, input: VendreCheckoutInput) {
    return useVendreStore.getState().checkout(eventId, input);
  },

  getPublicTicket(token: string): PurchasedTicket | undefined {
    return useVendreStore.getState().getTicketByToken(token);
  },

  claim(token: string, userId: string): PurchasedTicket | undefined {
    return useVendreStore.getState().claimByToken(token, userId);
  },

  async reconcileUser(userId: string, phone?: string, email?: string): Promise<number> {
    return useVendreStore.getState().reconcileForUser(userId, phone, email);
  },

  analytics(eventId: string): VendreAnalyticsSnapshot {
    return useVendreStore.getState().analytics(eventId);
  },

  walletTickets(userId: string): PurchasedTicket[] {
    return useVendreStore.getState().walletTicketsForUser(userId);
  },
};
