import type { WalletPass } from '@/types/database';
import { generateQrPayload } from './qr.engine';

export function createWalletPassPayload(
  pass: Pick<WalletPass, 'pass_type' | 'event_id' | 'reference_id'>,
  token?: string,
): string {
  const type = pass.pass_type === 'access' ? 'access' : pass.pass_type;
  return generateQrPayload({
    type,
    eventId: pass.event_id,
    referenceId: pass.reference_id,
    ...(token ? { token } : {}),
  });
}

export function groupPassesByEvent(passes: WalletPass[]): Map<string, WalletPass[]> {
  const map = new Map<string, WalletPass[]>();
  for (const pass of passes) {
    const list = map.get(pass.event_id) ?? [];
    list.push(pass);
    map.set(pass.event_id, list);
  }
  return map;
}
