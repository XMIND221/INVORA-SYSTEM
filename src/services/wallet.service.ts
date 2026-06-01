import { supabase } from '@/supabase/client';
import type { WalletPass } from '@/types/database';

export async function addPassToWallet(input: {
  userId: string;
  eventId: string;
  passType: WalletPass['pass_type'];
  referenceId: string;
  qrPayload: string;
}): Promise<WalletPass> {
  const { data, error } = await supabase
    .from('wallet_passes')
    .insert({
      user_id: input.userId,
      event_id: input.eventId,
      pass_type: input.passType,
      reference_id: input.referenceId,
      qr_payload: input.qrPayload,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function listUserWalletPasses(userId: string): Promise<WalletPass[]> {
  const { data, error } = await supabase
    .from('wallet_passes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
