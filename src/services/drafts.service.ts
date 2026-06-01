import { supabase } from '@/supabase/client';
import type { Draft } from '@/types/database';

export async function saveDraft(input: {
  userId: string;
  entityType: string;
  payload: Record<string, unknown>;
}): Promise<Draft> {
  const { data: existing } = await supabase
    .from('drafts')
    .select('id')
    .eq('user_id', input.userId)
    .eq('entity_type', input.entityType)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from('drafts')
      .update({
        payload: input.payload as import('@/types/database').Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('drafts')
    .insert({
      user_id: input.userId,
      entity_type: input.entityType,
      payload: input.payload as import('@/types/database').Json,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getDraft(userId: string, entityType: string): Promise<Draft | null> {
  const { data, error } = await supabase
    .from('drafts')
    .select('*')
    .eq('user_id', userId)
    .eq('entity_type', entityType)
    .maybeSingle();

  if (error) throw error;
  return data;
}
