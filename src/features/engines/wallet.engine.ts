import type { WalletPass } from '@/types/database';
import type { InviterGuest, WalletPassTab } from '@/types/inviter';
import { walletTabForGuest } from './inviter.engine';
import { generateQrPayload } from './qr.engine';

export const WALLET_TAB_LABEL: Record<WalletPassTab, string> = {
  today: 'Aujourd’hui',
  upcoming: 'À venir',
  used: 'Utilisés',
  expired: 'Expirés',
  cancelled: 'Annulés',
};

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

export function groupInviterGuestsByWalletTab(
  guests: InviterGuest[],
): Record<WalletPassTab, InviterGuest[]> {
  const tabs: Record<WalletPassTab, InviterGuest[]> = {
    today: [],
    upcoming: [],
    used: [],
    expired: [],
    cancelled: [],
  };
  for (const g of guests) {
    tabs[walletTabForGuest(g)].push(g);
  }
  return tabs;
}

/** Passes wallet dérivés des accès INVITER réclamés ou réconciliés. */
export function inviterGuestsToWalletView(
  guests: InviterGuest[],
  eventTitles: Record<string, string>,
): Array<InviterGuest & { eventTitle: string; walletTab: WalletPassTab }> {
  return guests
    .filter((g) => g.claimed || g.userId || ['opened', 'distributed'].includes(g.status))
    .map((g) => ({
      ...g,
      eventTitle: eventTitles[g.eventId] ?? 'Expérience',
      walletTab: walletTabForGuest(g),
    }));
}
