import { supabase } from '@/supabase/client';
import type { Ticket, TicketType } from '@/types/database';
import { generateQrPayload } from '@/features/engines/qr.engine';

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

export async function issueTicket(input: {
  eventId: string;
  ticketTypeId: string;
  ownerId?: string;
}): Promise<Ticket> {
  const qrPayload = generateQrPayload({
    type: 'ticket',
    eventId: input.eventId,
    referenceId: crypto.randomUUID(),
  });

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      event_id: input.eventId,
      ticket_type_id: input.ticketTypeId,
      owner_id: input.ownerId ?? null,
      qr_payload: qrPayload,
      status: 'valid',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
