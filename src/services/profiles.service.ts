import { supabase } from '@/supabase/client';
import type { Profile } from '@/types/database';
import type { UserRole } from '@/types/roles';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'avatar_url' | 'phone' | 'locale'>>,
) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function setPrimaryRole(userId: string, role: UserRole) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ primary_role: role, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
