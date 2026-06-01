import type { InviterAccessType, InviterGuest } from '@/types/inviter';
import { buildGuestSecureLink, buildGuestQrPayload, generateUniqueAccessCode } from '@/features/engines/inviter.engine';

const BASE = typeof window !== 'undefined' ? window.location.origin : 'https://invora.app';

function guest(
  partial: Omit<InviterGuest, 'secureLink' | 'qrPayload'> & { token: string },
): InviterGuest {
  return {
    ...partial,
    qrPayload: buildGuestQrPayload(partial.eventId, partial.id, partial.token),
    secureLink: buildGuestSecureLink(BASE, partial.token),
  };
}

export const MOCK_ACCESS_TYPES: Record<string, InviterAccessType[]> = {
  'obsidian-gala': [
    { id: 'at-vip', eventId: 'obsidian-gala', code: 'vip', label: 'VIP', maxGuests: 50 },
    { id: 'at-ga', eventId: 'obsidian-gala', code: 'standard', label: 'Standard', maxGuests: 550 },
    { id: 'at-staff', eventId: 'obsidian-gala', code: 'staff', label: 'Staff', maxGuests: 30 },
  ],
};

export const MOCK_INVITER_GUESTS: InviterGuest[] = [
  guest({
    id: 'g-1',
    eventId: 'obsidian-gala',
    firstName: 'Aminata',
    lastName: 'Diallo',
    phone: '+221771234567',
    email: 'aminata@example.com',
    accessTypeCode: 'vip',
    status: 'distributed',
    token: 'tok-aminata-obsidian',
    uniqueCode: generateUniqueAccessCode('obsidian-gala'),
    distributionChannels: ['whatsapp', 'email'],
    claimed: false,
    distributedAt: '2026-01-10T10:00:00Z',
    createdAt: '2026-01-10T09:00:00Z',
  }),
  guest({
    id: 'g-2',
    eventId: 'obsidian-gala',
    firstName: 'Marc',
    lastName: 'Lefèvre',
    phone: '+33601020304',
    accessTypeCode: 'standard',
    status: 'opened',
    token: 'tok-marc-obsidian',
    uniqueCode: generateUniqueAccessCode('obsidian-gala'),
    distributionChannels: ['email'],
    claimed: false,
    openedAt: '2026-01-12T14:00:00Z',
    distributedAt: '2026-01-11T08:00:00Z',
    createdAt: '2026-01-11T08:00:00Z',
  }),
  guest({
    id: 'g-3',
    eventId: 'obsidian-gala',
    firstName: 'Léa',
    lastName: 'Martin',
    phone: '+33699887766',
    email: 'lea@invora.app',
    accessTypeCode: 'standard',
    status: 'claimed',
    token: 'tok-lea-obsidian',
    uniqueCode: 'INV-OBSIDI-4827',
    distributionChannels: ['whatsapp'],
    claimed: true,
    claimedAt: '2026-01-13T09:00:00Z',
    claimedBy: 'demo-user',
    userId: 'demo-user',
    distributedAt: '2026-01-10T12:00:00Z',
    createdAt: '2026-01-10T12:00:00Z',
  }),
  guest({
    id: 'g-4',
    eventId: 'obsidian-gala',
    firstName: 'Ibrahim',
    lastName: 'Sow',
    phone: '+221771234567',
    accessTypeCode: 'vip',
    status: 'created',
    token: 'tok-ibrahim-obsidian',
    uniqueCode: generateUniqueAccessCode('obsidian-gala'),
    distributionChannels: [],
    claimed: false,
    createdAt: '2026-01-14T11:00:00Z',
  }),
  guest({
    id: 'g-5',
    eventId: 'obsidian-gala',
    firstName: 'Sofia',
    lastName: 'Ndiaye',
    phone: '+221701112233',
    accessTypeCode: 'staff',
    status: 'scanned',
    token: 'tok-sofia-obsidian',
    uniqueCode: generateUniqueAccessCode('obsidian-gala'),
    distributionChannels: ['whatsapp'],
    claimed: true,
    userId: 'demo-user-2',
    scannedAt: '2026-12-24T20:01:00Z',
    distributedAt: '2026-01-09T10:00:00Z',
    createdAt: '2026-01-09T10:00:00Z',
  }),
];

/** Profil démo pour réconciliation (+221771234567 → Mariages A, Gala B, VIP C). */
export const DEMO_RECONCILE_PROFILE = {
  userId: 'demo-reconcile-user',
  phone: '+221771234567',
  email: 'aminata@example.com',
};
