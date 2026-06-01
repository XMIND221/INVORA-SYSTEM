import { create } from 'zustand';
import type {
  PricingBreakdown,
  TicketingStatus,
  VendreAnalyticsSnapshot,
  VendreCheckoutInput,
  VendreTicketType,
  PurchasedTicket,
} from '@/types/vendre';
import {
  claimTicketRecord,
  computeVendreAnalytics,
  createPurchasedTicketRecord,
  reconcileTicketsForUser,
} from '@/features/engines/vendre.engine';
import {
  MOCK_TICKETING_STATUS,
  MOCK_VENDRE_TICKET_TYPES,
  fixturePricingForPrice,
} from '@/integration/lovable/vendre-mock';

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

interface VendreState {
  ticketTypesByEvent: Record<string, VendreTicketType[]>;
  ticketsByEvent: Record<string, PurchasedTicket[]>;
  ticketingStatusByEvent: Record<string, TicketingStatus>;
  metricsByEvent: Record<string, { pageViews: number; cartAdds: number }>;
  walletUserId: string | null;

  initEvent: (eventId: string) => void;
  listTicketTypes: (eventId: string) => VendreTicketType[];
  listTickets: (eventId: string) => PurchasedTicket[];
  getTicketingStatus: (eventId: string) => TicketingStatus;
  setTicketingStatus: (eventId: string, status: TicketingStatus) => void;

  /** Prix via fixture offline — en prod : vendreService.fetchPricing (RPC). */
  previewPricing: (priceFcfa: number) => PricingBreakdown;

  addTicketType: (
    eventId: string,
    input: Omit<VendreTicketType, 'id' | 'eventId' | 'soldCount'> & { priceFcfa: number },
  ) => VendreTicketType;

  publishTicketing: (eventId: string) => void;
  startSale: (eventId: string) => void;

  recordCartAdd: (eventId: string) => void;
  recordPageView: (eventId: string) => void;

  checkout: (
    eventId: string,
    input: VendreCheckoutInput,
  ) => { tickets: PurchasedTicket[]; transactionId: string } | { error: string };

  getTicketByToken: (token: string) => PurchasedTicket | undefined;
  claimByToken: (token: string, userId: string) => PurchasedTicket | undefined;
  reconcileForUser: (userId: string, phone?: string, email?: string) => number;
  walletTicketsForUser: (userId: string) => PurchasedTicket[];
  analytics: (eventId: string) => VendreAnalyticsSnapshot;
}

function seedTypes(): Record<string, VendreTicketType[]> {
  const map: Record<string, VendreTicketType[]> = {};
  for (const t of MOCK_VENDRE_TICKET_TYPES) {
    const list = map[t.eventId] ?? [];
    list.push(t);
    map[t.eventId] = list;
  }
  return map;
}

export const useVendreStore = create<VendreState>((set, get) => ({
  ticketTypesByEvent: seedTypes(),
  ticketsByEvent: {},
  ticketingStatusByEvent: { ...MOCK_TICKETING_STATUS },
  metricsByEvent: {
    'showcase-06': { pageViews: 3200, cartAdds: 410 },
  },
  walletUserId: 'demo-user',

  initEvent: (eventId) => {
    if (!get().ticketTypesByEvent[eventId]) {
      set((s) => ({
        ticketTypesByEvent: {
          ...s.ticketTypesByEvent,
          [eventId]: [],
        },
        ticketingStatusByEvent: {
          ...s.ticketingStatusByEvent,
          [eventId]: 'draft',
        },
      }));
    }
  },

  listTicketTypes: (eventId) => get().ticketTypesByEvent[eventId] ?? [],
  listTickets: (eventId) => get().ticketsByEvent[eventId] ?? [],
  getTicketingStatus: (eventId) => get().ticketingStatusByEvent[eventId] ?? 'draft',
  setTicketingStatus: (eventId, status) =>
    set((s) => ({
      ticketingStatusByEvent: { ...s.ticketingStatusByEvent, [eventId]: status },
    })),

  previewPricing: (priceFcfa) => fixturePricingForPrice(priceFcfa),

  addTicketType: (eventId, input) => {
    const pricing =
      input.commissionFcfa > 0 || input.priceFcfa === 0
        ? {
            commissionFcfa: input.commissionFcfa,
            organizerNetFcfa: input.organizerNetFcfa,
          }
        : fixturePricingForPrice(input.priceFcfa);
    const type: VendreTicketType = {
      id: crypto.randomUUID(),
      eventId,
      code: input.code,
      name: input.name,
      description: input.description,
      priceFcfa: input.priceFcfa,
      commissionFcfa: pricing.commissionFcfa,
      organizerNetFcfa: pricing.organizerNetFcfa,
      quantity: input.quantity,
      soldCount: 0,
      isActive: input.isActive,
      ticketingStatus: input.ticketingStatus ?? 'draft',
    };
    set((s) => ({
      ticketTypesByEvent: {
        ...s.ticketTypesByEvent,
        [eventId]: [...(s.ticketTypesByEvent[eventId] ?? []), type],
      },
    }));
    return type;
  },

  publishTicketing: (eventId) => {
    get().setTicketingStatus(eventId, 'published');
    set((s) => ({
      ticketTypesByEvent: {
        ...s.ticketTypesByEvent,
        [eventId]: (s.ticketTypesByEvent[eventId] ?? []).map((t) => ({
          ...t,
          ticketingStatus: t.ticketingStatus === 'draft' ? 'published' : t.ticketingStatus,
        })),
      },
    }));
  },

  startSale: (eventId) => {
    get().setTicketingStatus(eventId, 'on_sale');
  },

  recordCartAdd: (eventId) =>
    set((s) => ({
      metricsByEvent: {
        ...s.metricsByEvent,
        [eventId]: {
          pageViews: s.metricsByEvent[eventId]?.pageViews ?? 0,
          cartAdds: (s.metricsByEvent[eventId]?.cartAdds ?? 0) + 1,
        },
      },
    })),

  recordPageView: (eventId) =>
    set((s) => ({
      metricsByEvent: {
        ...s.metricsByEvent,
        [eventId]: {
          pageViews: (s.metricsByEvent[eventId]?.pageViews ?? 0) + 1,
          cartAdds: s.metricsByEvent[eventId]?.cartAdds ?? 0,
        },
      },
    })),

  checkout: (eventId, input) => {
    const types = get().listTicketTypes(eventId);
    const type = types.find((t) => t.id === input.ticketTypeId);
    if (!type) return { error: 'ticket_type_not_found' };
    const stock = type.quantity === null ? null : type.quantity - type.soldCount;
    if (stock !== null && stock < input.quantity) return { error: 'insufficient_stock' };

    const transactionId = crypto.randomUUID();
    const tickets: PurchasedTicket[] = [];
    for (let i = 0; i < input.quantity; i++) {
      tickets.push(
        createPurchasedTicketRecord(eventId, type, input, BASE_URL, 'paid', transactionId),
      );
    }

    set((s) => {
      const updatedTypes = (s.ticketTypesByEvent[eventId] ?? []).map((t) =>
        t.id === type.id ? { ...t, soldCount: t.soldCount + input.quantity } : t,
      );
      return {
        ticketTypesByEvent: { ...s.ticketTypesByEvent, [eventId]: updatedTypes },
        ticketsByEvent: {
          ...s.ticketsByEvent,
          [eventId]: [...(s.ticketsByEvent[eventId] ?? []), ...tickets],
        },
        metricsByEvent: {
          ...s.metricsByEvent,
          [eventId]: {
            pageViews: s.metricsByEvent[eventId]?.pageViews ?? 0,
            cartAdds: s.metricsByEvent[eventId]?.cartAdds ?? 0,
          },
        },
      };
    });

    return { tickets, transactionId };
  },

  getTicketByToken: (token) => {
    for (const list of Object.values(get().ticketsByEvent)) {
      const t = list.find((x) => x.accessToken === token);
      if (t) return t;
    }
    return undefined;
  },

  claimByToken: (token, userId) => {
    const ticket = get().getTicketByToken(token);
    if (!ticket) return undefined;
    try {
      const claimed = claimTicketRecord(ticket, userId);
      set((s) => patchTicket(s.ticketsByEvent, claimed));
      return claimed;
    } catch {
      return undefined;
    }
  },

  reconcileForUser: (userId, phone, email) => {
    let count = 0;
    set((s) => {
      const next: Record<string, PurchasedTicket[]> = {};
      for (const [eid, list] of Object.entries(s.ticketsByEvent)) {
        const reconciled = reconcileTicketsForUser(list, userId, { phone, email });
        for (let i = 0; i < list.length; i++) {
          if (!list[i]!.userId && reconciled[i]!.userId === userId) count += 1;
        }
        next[eid] = reconciled;
      }
      return { ticketsByEvent: next, walletUserId: userId };
    });
    return count;
  },

  walletTicketsForUser: (userId) => {
    const all: PurchasedTicket[] = [];
    for (const list of Object.values(get().ticketsByEvent)) {
      for (const t of list) {
        if (t.userId === userId || (t.claimed && t.claimedBy === userId)) all.push(t);
      }
    }
    return all;
  },

  analytics: (eventId) => {
    const metrics = get().metricsByEvent[eventId] ?? { pageViews: 0, cartAdds: 0 };
    return computeVendreAnalytics(
      get().listTicketTypes(eventId),
      get().listTickets(eventId),
      metrics,
    );
  },
}));

function patchTicket(
  map: Record<string, PurchasedTicket[]>,
  ticket: PurchasedTicket,
): Record<string, PurchasedTicket[]> {
  const next: Record<string, PurchasedTicket[]> = {};
  for (const [eid, list] of Object.entries(map)) {
    next[eid] = list.map((x) => (x.id === ticket.id ? ticket : x));
  }
  return next;
}
