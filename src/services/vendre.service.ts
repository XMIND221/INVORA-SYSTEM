import { supabase } from '@/supabase/client';
import { mapTicketTypeRow } from '@/lib/ticket-mapper';
import { fixturePricingForPrice } from '@/integration/lovable/vendre-mock';
import {
  claimTicketByToken,
  getPublicTicketByToken,
  logTicketDistribution,
} from '@/services/tickets.service';
import type {
  PricingBreakdown,
  PurchasedTicket,
  TicketingStatus,
  VendreAnalyticsSnapshot,
  VendreTicketType,
} from '@/types/vendre';

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
      return mapPricingRow(fnData.pricing as RpcPricingRow);
    }
  } catch {
    /* offline */
  }

  return fixturePricingForPrice(priceFcfa);
}

async function fetchPublicCatalog(eventKey: string): Promise<{
  eventId: string | null;
  ticketingStatus: TicketingStatus;
  types: VendreTicketType[];
}> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, string>) => ReturnType<typeof supabase.rpc>
  )('list_public_ticket_types', { p_event_key: eventKey });

  if (error) throw error;
  const row = (data ?? {}) as Record<string, unknown>;
  let typesRaw = row.types;
  if (typeof typesRaw === 'string') {
    try {
      typesRaw = JSON.parse(typesRaw) as unknown[];
    } catch {
      typesRaw = [];
    }
  }
  const typesList = (Array.isArray(typesRaw) ? typesRaw : []) as Parameters<typeof mapTicketTypeRow>[0][];

  return {
    eventId: row.eventId ? String(row.eventId) : null,
    ticketingStatus: (String(row.ticketingStatus ?? 'draft')) as TicketingStatus,
    types: typesList.map(mapTicketTypeRow),
  };
}

export async function recordTicketingFunnel(eventId: string, action: 'page_view' | 'cart_add'): Promise<void> {
  await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('record_ticketing_funnel', { p_event_id: eventId, p_action: action });
}

export const vendreService = {
  async listTicketTypes(eventId: string): Promise<VendreTicketType[]> {
    const catalog = await fetchPublicCatalog(eventId);
    return catalog.types;
  },

  async getTicketingStatus(eventId: string): Promise<TicketingStatus> {
    const catalog = await fetchPublicCatalog(eventId);
    return catalog.ticketingStatus;
  },

  fetchPricing: fetchPricingFromServer,

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
    const { data, error } = await supabase
      .from('ticket_types')
      .insert({
        event_id: eventId,
        code: input.code,
        name: input.name,
        description: input.description,
        price_cents: input.priceFcfa,
        quantity: input.quantity,
        commission_fcfa: pricing.commissionFcfa,
        organizer_net_fcfa: pricing.organizerNetFcfa,
        sold_count: 0,
        is_active: true,
        ticketing_status: 'draft',
      })
      .select()
      .single();

    if (error) throw error;
    return mapTicketTypeRow({
      id: data.id,
      eventId: data.event_id,
      code: data.code ?? undefined,
      name: data.name,
      description: data.description ?? undefined,
      priceFcfa: data.price_cents,
      commissionFcfa: data.commission_fcfa ?? undefined,
      organizerNetFcfa: data.organizer_net_fcfa ?? undefined,
      quantity: data.quantity,
      soldCount: data.sold_count,
      isActive: data.is_active,
      ticketingStatus: data.ticketing_status ?? 'draft',
    });
  },

  async publishTicketing(eventId: string): Promise<void> {
    await supabase.from('events').update({ ticketing_status: 'published' }).eq('id', eventId);
  },

  async startSale(eventId: string): Promise<void> {
    await supabase.from('events').update({ ticketing_status: 'on_sale' }).eq('id', eventId);
  },

  recordPageView: (eventId: string) => void recordTicketingFunnel(eventId, 'page_view'),
  recordCartAdd: (eventId: string) => void recordTicketingFunnel(eventId, 'cart_add'),

  getPublicTicket: getPublicTicketByToken,

  async claim(token: string, userId: string): Promise<PurchasedTicket | null> {
    await claimTicketByToken(token, userId);
    const view = await getPublicTicketByToken(token);
    return view?.ticket ?? null;
  },

  async reconcileUser(userId: string): Promise<number> {
    const { data, error } = await (
      supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
    )('reconcile_user_tickets', { p_user_id: userId });
    if (error) throw error;
    return Number(data ?? 0);
  },

  async analytics(eventId: string): Promise<VendreAnalyticsSnapshot> {
    const { data, error } = await (
      supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
    )('get_vendre_ticketing_analytics', { p_event_id: eventId });

    if (error) throw error;
    const row = (data ?? {}) as Record<string, number>;
    return {
      pageViews: Number(row.pageViews ?? 0),
      cartAdds: Number(row.cartAdds ?? 0),
      purchases: Number(row.purchases ?? 0),
      conversionRate: Number(row.conversionRate ?? 0),
      ticketsSold: Number(row.ticketsSold ?? 0),
      ticketsUsed: Number(row.ticketsUsed ?? 0),
      ticketsRefunded: Number(row.ticketsRefunded ?? 0),
      grossRevenueFcfa: Number(row.grossRevenueFcfa ?? 0),
      organizerRevenueFcfa: Number(row.organizerRevenueFcfa ?? 0),
      invoraCommissionFcfa: Number(row.invoraCommissionFcfa ?? 0),
      attendanceRate: Number(row.attendanceRate ?? 0),
    };
  },

  logDistribution: logTicketDistribution,
};
