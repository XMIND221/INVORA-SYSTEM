import { supabase } from '@/supabase/client';
import type { Scan } from '@/types/database';
import { validateAccessScan } from '@/services/scanner.service';

/** @deprecated Utiliser scannerService.validateScan → RPC validate_access_scan */
export async function recordScan(input: {
  eventId: string;
  scannerId: string;
  passReference: string;
  existingScanHashes: string[];
}): Promise<{ scan: Scan; result: Scan['result'] }> {
  void input.scannerId;
  void input.existingScanHashes;
  const display = await validateAccessScan({
    eventId: input.eventId,
    passReference: input.passReference,
    gateCode: 'main',
  });
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('id', display.scanId)
    .maybeSingle();
  if (error) throw error;
  const scan = data ?? {
    id: display.scanId,
    event_id: input.eventId,
    scanner_id: input.scannerId,
    pass_reference: input.passReference,
    result: display.result,
    scanned_at: new Date().toISOString(),
    metadata: null,
  };
  return { scan: scan as Scan, result: display.result };
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
