import { supabase } from '@/supabase/client';
import type { Invitation } from '@/types/database';
import { generateQrPayload } from '@/features/engines/qr.engine';

export async function createInvitation(input: {
  eventId: string;
  guestEmail?: string;
  guestName?: string;
}): Promise<Invitation> {
  const token = crypto.randomUUID();
  const uniqueCode = token.replace(/-/g, '').slice(0, 12).toUpperCase();

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      event_id: input.eventId,
      guest_email: input.guestEmail ?? null,
      guest_name: input.guestName ?? null,
      token,
      unique_code: uniqueCode,
      status: 'created',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Invitation;
}

export async function getInvitationByToken(token: string): Promise<Invitation | null> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error) throw error;
  return data as Invitation | null;
}

export function buildInvitationQrPayload(invitation: Invitation): string {
  return generateQrPayload({
    type: 'invitation',
    eventId: invitation.event_id,
    referenceId: invitation.id,
    token: invitation.token,
  });
}
