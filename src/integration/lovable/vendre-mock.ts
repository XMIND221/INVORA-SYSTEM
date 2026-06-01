import type { PricingBreakdown, VendreTicketType, TicketingStatus } from '@/types/vendre';

/** Grille alignée sur RPC `calculate_invora_commission` — valeurs figées pour mock offline uniquement. */
export const VENDRE_PRICING_FIXTURES: Record<number, PricingBreakdown> = {
  0: { priceFcfa: 0, commissionFcfa: 0, organizerNetFcfa: 0, currency: 'XOF' },
  5000: { priceFcfa: 5000, commissionFcfa: 500, organizerNetFcfa: 4500, currency: 'XOF' },
  10000: { priceFcfa: 10000, commissionFcfa: 750, organizerNetFcfa: 9250, currency: 'XOF' },
  15000: { priceFcfa: 15000, commissionFcfa: 750, organizerNetFcfa: 14250, currency: 'XOF' },
  25000: { priceFcfa: 25000, commissionFcfa: 1000, organizerNetFcfa: 24000, currency: 'XOF' },
  50000: { priceFcfa: 50000, commissionFcfa: 1500, organizerNetFcfa: 48500, currency: 'XOF' },
};

export function fixturePricingForPrice(priceFcfa: number): PricingBreakdown {
  const keys = Object.keys(VENDRE_PRICING_FIXTURES)
    .map(Number)
    .sort((a, b) => b - a);
  for (const k of keys) {
    if (priceFcfa >= k) return VENDRE_PRICING_FIXTURES[k]!;
  }
  return VENDRE_PRICING_FIXTURES[0]!;
}

export const MOCK_VENDRE_TICKET_TYPES: VendreTicketType[] = [
  {
    id: 'tt-standard-showcase',
    eventId: 'showcase-06',
    code: 'standard',
    name: 'Standard',
    description: 'Entrée générale',
    priceFcfa: 10000,
    commissionFcfa: 750,
    organizerNetFcfa: 9250,
    quantity: 200,
    soldCount: 180,
    isActive: true,
    ticketingStatus: 'on_sale',
  },
  {
    id: 'tt-vip-showcase',
    eventId: 'showcase-06',
    code: 'vip',
    name: 'VIP',
    description: 'Carré or + lounge',
    priceFcfa: 25000,
    commissionFcfa: 1000,
    organizerNetFcfa: 24000,
    quantity: 100,
    soldCount: 32,
    isActive: true,
    ticketingStatus: 'on_sale',
  },
  {
    id: 'tt-premium-showcase',
    eventId: 'showcase-06',
    code: 'premium',
    name: 'Premium',
    description: 'Early access + goodies',
    priceFcfa: 0,
    commissionFcfa: 0,
    organizerNetFcfa: 0,
    quantity: 50,
    soldCount: 0,
    isActive: true,
    ticketingStatus: 'draft',
  },
];

export const MOCK_TICKETING_STATUS: Record<string, TicketingStatus> = {
  'showcase-06': 'on_sale',
};

export const DEMO_VENDRE_RECONCILE = {
  userId: 'demo-vendre-user',
  phone: '+33601020304',
  email: 'marc@example.com',
};
