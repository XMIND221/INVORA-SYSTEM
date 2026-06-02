import { supabase } from '@/supabase/client';
import { mapPublicTicketPayload, mapRpcToPurchasedTicket, type PublicTicketView } from '@/lib/ticket-mapper';
import type { Ticket, TicketType } from '@/types/database';
import type { PurchasedTicket } from '@/types/vendre';

type RpcTicketRow = Parameters<typeof mapRpcToPurchasedTicket>[0];

export async function createTicketType(input: {
  eventId: string;
  name: string;
  priceCents: number;
  currency?: string;
  quantity?: number;
}): Promise<TicketType> {
  const { data, error } = await supabase
    .from('ticket_types')
    .insert({
      event_id: input.eventId,
      name: input.name,
      price_cents: input.priceCents,
      currency: input.currency ?? 'XOF',
      quantity: input.quantity ?? null,
      sold_count: 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPublicTicketByToken(accessToken: string): Promise<PublicTicketView | null> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('get_public_ticket_by_token', { p_access_token: accessToken });

  if (error) throw error;
  if (!data || typeof data !== 'object') return null;

  const payload = data as { ticket: RpcTicketRow; event: { title: string; location?: string; startsAt?: string; endsAt?: string; coverUrl?: string; id: string } };
  return mapPublicTicketPayload({
    ticket: payload.ticket,
    event: {
      id: payload.event.id,
      title: payload.event.title,
      location: payload.event.location,
      startsAt: payload.event.startsAt,
      endsAt: payload.event.endsAt,
      coverUrl: payload.event.coverUrl,
    },
  });
}

export async function getTicketsForPaymentAttempt(paymentAttemptId: string): Promise<PurchasedTicket[]> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('get_tickets_for_payment_attempt', { p_payment_attempt_id: paymentAttemptId });

  if (error) throw error;
  const raw = data as unknown;
  const rows = (Array.isArray(raw) ? raw : []) as {
    id: string;
    accessToken: string;
    uniqueCode: string;
    paymentStatus: string;
  }[];
  if (!rows.length) return [];

  const tokens = rows.map((r) => r.accessToken);
  const tickets: PurchasedTicket[] = [];
  for (const token of tokens) {
    const view = await getPublicTicketByToken(token);
    if (view) tickets.push(view.ticket);
  }
  return tickets;
}

export async function claimTicketByToken(accessToken: string, userId: string): Promise<string> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('claim_ticket', { p_access_token: accessToken, p_user_id: userId });

  if (error) throw error;
  return String(data);
}

export async function logTicketDistribution(
  accessToken: string,
  channel: 'email' | 'whatsapp' | 'link' | 'download',
  userId?: string,
): Promise<void> {
  const { error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('log_ticket_distribution', {
    p_access_token: accessToken,
    p_channel: channel,
    p_user_id: userId ?? null,
  });
  if (error) throw error;
}

export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  const { data, error } = await supabase.from('tickets').select('*').eq('id', ticketId).maybeSingle();
  if (error) throw error;
  return data;
}
