import { create } from 'zustand';
import {
  computeWalletAnalytics,
  inviterGuestToAccess,
  reconcileAccessesForProfile,
  ticketToAccess,
} from '@/features/engines/access.engine';
import { getOrganizerEvent } from '@/integration/lovable/organizer-mock';
import { MOCK_WALLET_NOTIFICATIONS, MOCK_WALLET_USER_ID } from '@/integration/lovable/wallet-access-mock';
import { useInviterStore } from '@/store/inviter.store';
import { useVendreStore } from '@/store/vendre.store';
import type { InvoraAccess, WalletAnalyticsSnapshot, WalletNotificationPrep } from '@/types/access';
import type { InviterGuest } from '@/types/inviter';

interface AccessState {
  walletUserId: string;
  notifications: WalletNotificationPrep[];

  setWalletUserId: (id: string) => void;
  buildUnifiedAccesses: (userId: string) => InvoraAccess[];
  reconcileWallet: (userId: string, phone?: string, email?: string) => number;
  analytics: (userId: string) => WalletAnalyticsSnapshot;
}

function accessTypeLabel(eventId: string, code: string): string {
  const types = useInviterStore.getState().listAccessTypes(eventId);
  return types.find((t) => t.code === code)?.label ?? code;
}

function guestsVisibleInWallet(guests: InviterGuest[], userId: string): InviterGuest[] {
  return guests.filter(
    (g) =>
      g.userId === userId ||
      g.claimed ||
      ['opened', 'distributed', 'claimed', 'scanned'].includes(g.status),
  );
}

export const useAccessStore = create<AccessState>((set, get) => ({
  walletUserId: MOCK_WALLET_USER_ID,
  notifications: [...MOCK_WALLET_NOTIFICATIONS],

  setWalletUserId: (id) => set({ walletUserId: id }),

  buildUnifiedAccesses: (userId) => {
    const inviterGuests = useInviterStore.getState().walletGuestsForUser(userId);
    const allGuests = Object.values(useInviterStore.getState().guestsByEvent).flat();
    const guests = [
      ...inviterGuests,
      ...guestsVisibleInWallet(allGuests, userId).filter(
        (g) => !inviterGuests.some((x) => x.id === g.id),
      ),
    ];

    const invitationAccesses = guests.map((g) => {
      const event = getOrganizerEvent(g.eventId);
      return inviterGuestToAccess(g, {
        eventTitle: event?.title ?? g.eventId,
        eventDate: event?.dateLabel,
        eventLocation: event?.location,
        accessTypeLabel: accessTypeLabel(g.eventId, g.accessTypeCode),
      });
    });

    const tickets = useVendreStore.getState().walletTicketsForUser(userId);
    const ticketAccesses = tickets.map((t) => {
      const event = getOrganizerEvent(t.eventId);
      return ticketToAccess(t, {
        eventTitle: event?.title ?? t.eventId,
        eventDate: event?.dateLabel,
        eventLocation: event?.location,
      });
    });

    return [...invitationAccesses, ...ticketAccesses].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  reconcileWallet: (userId, phone, email) => {
    useInviterStore.getState().reconcileForUser(userId, phone, email);
    useVendreStore.getState().reconcileForUser(userId, phone, email);
    set({ walletUserId: userId });
    const accesses = get().buildUnifiedAccesses(userId);
    const reconciled = reconcileAccessesForProfile(accesses, userId, { phone, email });
    return reconciled.filter((a) => a.userId === userId && a.claimed).length;
  },

  analytics: (userId) => computeWalletAnalytics(get().buildUnifiedAccesses(userId)),
}));
