import { create } from 'zustand';
import type { InviterAccessType, InviterGuest, InviterGuestInput } from '@/types/inviter';
import type { DistributionChannel } from '@/types/inviter';
import {
  applyDistribution,
  claimGuest,
  computeInviterAnalytics,
  createGuestRecord,
  markGuestOpened,
  markGuestScanned,
  reconcileGuestsForUser,
  validateGuestInput,
} from '@/features/engines/inviter.engine';
import { MOCK_ACCESS_TYPES, MOCK_INVITER_GUESTS } from '@/integration/lovable/inviter-mock';

const BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';

interface InviterState {
  accessTypesByEvent: Record<string, InviterAccessType[]>;
  guestsByEvent: Record<string, InviterGuest[]>;
  /** Accès réconciliés / réclamés visibles dans le wallet invité */
  walletUserId: string | null;
  initEvent: (eventId: string) => void;
  listGuests: (eventId: string) => InviterGuest[];
  listAccessTypes: (eventId: string) => InviterAccessType[];
  getGuestByToken: (token: string) => InviterGuest | undefined;
  addGuest: (eventId: string, input: InviterGuestInput) => { guest?: InviterGuest; errors?: string[] };
  addGuestsBulk: (eventId: string, inputs: InviterGuestInput[]) => InviterGuest[];
  distribute: (
    eventId: string,
    guestIds: string[],
    channels: DistributionChannel[],
  ) => void;
  openByToken: (token: string) => InviterGuest | undefined;
  claimByToken: (token: string, userId: string) => InviterGuest | undefined;
  reconcileForUser: (userId: string, phone?: string, email?: string) => number;
  analytics: (eventId: string) => ReturnType<typeof computeInviterAnalytics>;
  walletGuestsForUser: (userId: string) => InviterGuest[];
}

function seedGuests(): Record<string, InviterGuest[]> {
  const map: Record<string, InviterGuest[]> = {};
  for (const g of MOCK_INVITER_GUESTS) {
    const list = map[g.eventId] ?? [];
    list.push(g);
    map[g.eventId] = list;
  }
  return map;
}

export const useInviterStore = create<InviterState>((set, get) => ({
  accessTypesByEvent: { ...MOCK_ACCESS_TYPES },
  guestsByEvent: seedGuests(),
  walletUserId: 'demo-user',

  initEvent: (eventId) => {
    const state = get();
    if (!state.accessTypesByEvent[eventId]) {
      set({
        accessTypesByEvent: {
          ...state.accessTypesByEvent,
          [eventId]: [
            { id: `at-${eventId}-std`, eventId, code: 'standard', label: 'Standard' },
            { id: `at-${eventId}-vip`, eventId, code: 'vip', label: 'VIP' },
          ],
        },
      });
    }
  },

  listGuests: (eventId) => get().guestsByEvent[eventId] ?? [],

  listAccessTypes: (eventId) => get().accessTypesByEvent[eventId] ?? [],

  getGuestByToken: (token) => {
    for (const guests of Object.values(get().guestsByEvent)) {
      const found = guests.find((g) => g.token === token);
      if (found) return found;
    }
    return undefined;
  },

  addGuest: (eventId, input) => {
    const check = validateGuestInput(input);
    if (!check.valid) return { errors: check.errors };
    const guest = createGuestRecord(eventId, input, BASE_URL);
    set((s) => ({
      guestsByEvent: {
        ...s.guestsByEvent,
        [eventId]: [...(s.guestsByEvent[eventId] ?? []), guest],
      },
    }));
    return { guest };
  },

  addGuestsBulk: (eventId, inputs) => {
    const added: InviterGuest[] = [];
    for (const input of inputs) {
      const r = get().addGuest(eventId, input);
      if (r.guest) added.push(r.guest);
    }
    return added;
  },

  distribute: (eventId, guestIds, channels) => {
    set((s) => {
      const guests = (s.guestsByEvent[eventId] ?? []).map((g) =>
        guestIds.includes(g.id) ? applyDistribution(g, channels) : g,
      );
      return { guestsByEvent: { ...s.guestsByEvent, [eventId]: guests } };
    });
  },

  openByToken: (token) => {
    const g = get().getGuestByToken(token);
    if (!g) return undefined;
    const opened = markGuestOpened(g);
    set((s) => {
      const next: Record<string, InviterGuest[]> = {};
      for (const [eid, list] of Object.entries(s.guestsByEvent)) {
        next[eid] = list.map((x) => (x.id === opened.id ? opened : x));
      }
      return { guestsByEvent: next };
    });
    return opened;
  },

  claimByToken: (token, userId) => {
    const g = get().getGuestByToken(token);
    if (!g) return undefined;
    try {
      const claimed = claimGuest(g, userId);
      set((s) => ({
        guestsByEvent: patchGuest(s.guestsByEvent, claimed),
        walletUserId: userId,
      }));
      return claimed;
    } catch {
      return undefined;
    }
  },

  reconcileForUser: (userId, phone, email) => {
    let count = 0;
    set((s) => {
      const next: Record<string, InviterGuest[]> = {};
      for (const [eid, list] of Object.entries(s.guestsByEvent)) {
        const reconciled = reconcileGuestsForUser(list, userId, { phone, email });
        for (let i = 0; i < list.length; i++) {
          if (!list[i]!.userId && reconciled[i]!.userId === userId) count += 1;
        }
        next[eid] = reconciled;
      }
      return { guestsByEvent: next, walletUserId: userId };
    });
    return count;
  },

  analytics: (eventId) => computeInviterAnalytics(get().listGuests(eventId)),

  walletGuestsForUser: (userId) => {
    const all: InviterGuest[] = [];
    for (const list of Object.values(get().guestsByEvent)) {
      for (const g of list) {
        if (g.userId === userId || (g.claimed && g.claimedBy === userId)) {
          all.push(g);
        }
      }
    }
    return all;
  },
}));

function patchGuest(
  map: Record<string, InviterGuest[]>,
  guest: InviterGuest,
): Record<string, InviterGuest[]> {
  const next: Record<string, InviterGuest[]> = {};
  for (const [eid, list] of Object.entries(map)) {
    next[eid] = list.map((x) => (x.id === guest.id ? guest : x));
  }
  return next;
}

/** Démo scan depuis scanner */
export function demoScanGuest(guestId: string): void {
  useInviterStore.setState((s) => {
    const next: Record<string, InviterGuest[]> = {};
    for (const [eid, list] of Object.entries(s.guestsByEvent)) {
      next[eid] = list.map((g) => (g.id === guestId ? markGuestScanned(g) : g));
    }
    return { guestsByEvent: next };
  });
}
