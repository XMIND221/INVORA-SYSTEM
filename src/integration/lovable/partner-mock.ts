import type { PartnerCampaign, PartnerProfile, PartnerWithdrawalRequest } from '@/types/partner';
import { buildCampaignCode, buildPartnerShareLink } from '@/features/engines/partner.engine';

const BASE = typeof window !== 'undefined' ? window.location.origin : 'https://invora.app';

export const MOCK_PARTNER_PROFILE: PartnerProfile = {
  id: 'partner-demo-1',
  userId: 'demo-partner-user',
  partnerCode: 'XMIND221',
  displayId: 'PART-221',
};

export const MOCK_PARTNER_CAMPAIGNS: PartnerCampaign[] = [
  {
    id: 'pc-showcase',
    eventId: 'showcase-06',
    eventTitle: 'Showcase 06',
    dateLabel: '06 DÉC · Pantin',
    universe: 'vendre',
    campaignCode: buildCampaignCode(MOCK_PARTNER_PROFILE.partnerCode, 'showcase-06'),
    shareLink: buildPartnerShareLink(BASE, MOCK_PARTNER_PROFILE.partnerCode, 'showcase-06'),
    qrPath: buildPartnerShareLink(BASE, MOCK_PARTNER_PROFILE.partnerCode, 'showcase-06'),
    isActive: true,
    clicks: 1240,
    opens: 890,
    conversions: 38,
    invitationsGenerated: 0,
    ticketsSold: 38,
    commissionFcfa: 5700,
  },
  {
    id: 'pc-obsidian',
    eventId: 'obsidian-gala',
    eventTitle: 'Obsidian Gala',
    dateLabel: '24 DÉC · Paris',
    universe: 'inviter',
    campaignCode: buildCampaignCode(MOCK_PARTNER_PROFILE.partnerCode, 'obsidian-gala'),
    shareLink: buildPartnerShareLink(BASE, MOCK_PARTNER_PROFILE.partnerCode, 'obsidian-gala'),
    qrPath: buildPartnerShareLink(BASE, MOCK_PARTNER_PROFILE.partnerCode, 'obsidian-gala'),
    isActive: true,
    clicks: 420,
    opens: 310,
    conversions: 52,
    invitationsGenerated: 52,
    ticketsSold: 0,
    commissionFcfa: 4100,
  },
];

export const MOCK_PARTNER_WITHDRAWALS: PartnerWithdrawalRequest[] = [
  {
    id: 'w-1',
    amountFcfa: 50000,
    status: 'paid',
    requestedAt: '2026-01-15T10:00:00Z',
    processedAt: '2026-01-17T14:00:00Z',
  },
  {
    id: 'w-2',
    amountFcfa: 84050,
    status: 'pending',
    requestedAt: '2026-06-01T09:00:00Z',
  },
];

/** Fixtures alignées RPC — offline uniquement */
export const PARTNER_COMMISSION_FIXTURES = {
  inviter: { 50: 50, 150: 75, 400: 100, 600: 125 },
  vendre: { 8000: 100, 15000: 150, 30000: 200, 75000: 300, 120000: 500 },
} as const;
