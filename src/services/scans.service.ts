import { supabase } from '@/supabase/client';
import type { Scan } from '@/types/database';
import { validateScan } from '@/features/engines/scanner.engine';

export async function recordScan(input: {
  eventId: string;
  scannerId: string;
  passReference: string;
  existingScanHashes: string[];
}): Promise<{ scan: Scan; result: Scan['result'] }> {
  const result = validateScan({
    passReference: input.passReference,
    existingHashes: input.existingScanHashes,
  });

  const { data, error } = await supabase
    .from('scans')
    .insert({
      event_id: input.eventId,
      scanner_id: input.scannerId,
      pass_reference: input.passReference,
      result,
      metadata: null,
    })
    .select()
    .single();

  if (error) throw error;
  return { scan: data, result };
}

export async function listEventScans(eventId: string, limit = 100): Promise<Scan[]> {
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('event_id', eventId)
    .order('scanned_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}
