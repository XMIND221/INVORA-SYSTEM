import { supabase } from '@/supabase/client';
import type { Commission, Partner } from '@/types/database';

export async function getPartnerByUserId(userId: string): Promise<Partner | null> {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listPartnerCommissions(partnerId: string): Promise<Commission[]> {
  const { data, error } = await supabase
    .from('commissions')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}
