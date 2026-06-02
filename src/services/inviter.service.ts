import { useInviterStore } from '@/store/inviter.store';
import type {
  DistributionChannel,
  InviterAnalyticsSnapshot,
  InviterGuest,
  InviterGuestInput,
  PublicInvitationView,
} from '@/types/inviter';
import {
  buildEmailShareSubject,
  buildWhatsAppShareText,
  computeInviterAnalytics,
} from '@/features/engines/inviter.engine';

function accessTypeLabel(eventId: string, code: string): string {
  const types = useInviterStore.getState().listAccessTypes(eventId);
  return types.find((t) => t.code === code)?.label ?? code;
}

export const inviterService = {
  initEvent(eventId: string): void {
    useInviterStore.getState().initEvent(eventId);
  },

  listGuests(eventId: string): InviterGuest[] {
    return useInviterStore.getState().listGuests(eventId);
  },

  listAccessTypes(eventId: string) {
    return useInviterStore.getState().listAccessTypes(eventId);
  },

  addGuest(eventId: string, input: InviterGuestInput) {
    return useInviterStore.getState().addGuest(eventId, input);
  },

  distribute(eventId: string, guestIds: string[], channels: DistributionChannel[]): void {
    useInviterStore.getState().distribute(eventId, guestIds, channels);
    // Persistance Supabase : après `db push` migration Phase 3 + `npm run supabase:types`
  },

  getPublicInvitation(token: string): PublicInvitationView | null {
    const guest = useInviterStore.getState().getGuestByToken(token);
    if (!guest) return null;
    useInviterStore.getState().openByToken(token);
    return {
      token: guest.token,
      eventTitle: 'Expérience INVORA',
      eventDate: undefined,
      eventLocation: undefined,
      guestName: `${guest.firstName} ${guest.lastName}`,
      accessTypeLabel: accessTypeLabel(guest.eventId, guest.accessTypeCode),
      uniqueCode: guest.uniqueCode,
      qrPayload: guest.qrPayload,
      secureLink: guest.secureLink,
      status: guest.status,
      claimed: guest.claimed,
      accountRequired: false,
    };
  },

  claim(token: string, userId: string): InviterGuest | undefined {
    return useInviterStore.getState().claimByToken(token, userId);
  },

  async reconcileUser(userId: string, phone?: string, email?: string): Promise<number> {
    return useInviterStore.getState().reconcileForUser(userId, phone, email);
  },

  analytics(eventId: string): InviterAnalyticsSnapshot {
    return useInviterStore.getState().analytics(eventId);
  },

  buildSharePayload(guest: InviterGuest, eventTitle: string) {
    return {
      whatsapp: buildWhatsAppShareText(guest, eventTitle),
      emailSubject: buildEmailShareSubject(eventTitle),
      emailBody: buildWhatsAppShareText(guest, eventTitle),
      link: guest.secureLink,
      code: guest.uniqueCode,
    };
  },

  computeAnalyticsFromGuests(guests: InviterGuest[]): InviterAnalyticsSnapshot {
    return computeInviterAnalytics(guests);
  },
};
