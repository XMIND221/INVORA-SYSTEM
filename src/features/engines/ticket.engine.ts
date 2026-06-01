import type { EventUniverse } from '@/types/event';
import type { TicketType } from '@/types/database';

export function isTicketingUniverse(universe: EventUniverse): boolean {
  return universe === 'vendre';
}

export function remainingStock(ticketType: TicketType): number | null {
  if (ticketType.quantity === null) return null;
  return Math.max(0, ticketType.quantity - ticketType.sold_count);
}

export function canPurchase(ticketType: TicketType): boolean {
  if (!ticketType.is_active) return false;
  const stock = remainingStock(ticketType);
  return stock === null || stock > 0;
}
