import { supabase } from '@/supabase/client';
import { mapWalletRowToAccess, type WalletUnifiedRow } from '@/lib/ticket-mapper';
import type { InvoraAccess, WalletAnalyticsSnapshot } from '@/types/access';

export async function listUserWalletAccesses(userId: string): Promise<InvoraAccess[]> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('list_user_wallet_accesses', { p_user_id: userId });

  if (error) throw error;
  return ((data ?? []) as WalletUnifiedRow[]).map(mapWalletRowToAccess);
}

export async function searchUserWalletAccesses(userId: string, query: string): Promise<InvoraAccess[]> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('search_user_wallet_accesses', { p_user_id: userId, p_query: query });

  if (error) throw error;
  return ((data ?? []) as WalletUnifiedRow[]).map(mapWalletRowToAccess);
}

export async function getWalletAnalytics(userId: string): Promise<WalletAnalyticsSnapshot> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('get_wallet_access_analytics', { p_user_id: userId });

  if (error) throw error;
  const row = (data ?? {}) as Record<string, number>;
  return {
    active: Number(row.active ?? 0),
    used: Number(row.used ?? 0),
    expired: Number(row.expired ?? 0),
    cancelled: Number(row.cancelled ?? 0),
    utilizationRate: Number(row.utilizationRate ?? 0),
  };
}

export async function addPassToWallet(input: {
  userId: string;
  eventId: string;
  passType: 'invitation' | 'ticket' | 'access';
  referenceId: string;
  qrPayload: string;
}): Promise<void> {
  const { error } = await supabase.from('wallet_passes').insert({
    user_id: input.userId,
    event_id: input.eventId,
    pass_type: input.passType,
    reference_id: input.referenceId,
    qr_payload: input.qrPayload,
  });
  if (error) throw error;
}

export async function listUserWalletPasses(userId: string) {
  const { data, error } = await supabase
    .from('wallet_passes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
