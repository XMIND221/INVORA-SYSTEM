import type {
  PartnerAnalyticsSnapshot,
  PartnerCampaign,
  PartnerProfile,
  PartnerWalletSummary,
  PartnerWithdrawalRequest,
} from '@/types/partner';
import { appendPartnerRefToUrl } from '@/lib/partner-attribution';

const BASE = typeof window !== 'undefined' ? window.location.origin : '';

export function mapPartnerProfile(row: {
  id: string;
  userId: string;
  partnerCode: string;
  displayId: string;
}): PartnerProfile {
  return {
    id: row.id,
    userId: row.userId,
    partnerCode: row.partnerCode,
    displayId: row.displayId,
  };
}

export function mapPartnerCampaign(row: {
  id: string;
  eventId: string;
  eventTitle: string;
  dateLabel?: string;
  universe: 'inviter' | 'vendre';
  campaignCode: string;
  sharePath: string;
  isActive: boolean;
  clicks: number;
  opens: number;
  conversions: number;
  invitationsGenerated: number;
  ticketsSold: number;
  commissionFcfa: number;
  partnerCode?: string;
}): PartnerCampaign {
  const shareLink = `${BASE}${row.sharePath}`;
  const code = row.partnerCode ?? row.campaignCode.split('-')[0] ?? '';
  return {
    id: row.id,
    eventId: row.eventId,
    eventTitle: row.eventTitle,
    dateLabel: row.dateLabel ?? '',
    universe: row.universe,
    campaignCode: row.campaignCode,
    shareLink: code ? appendPartnerRefToUrl(shareLink, code) : shareLink,
    qrPath: shareLink,
    isActive: row.isActive,
    clicks: row.clicks,
    opens: row.opens,
    conversions: row.conversions,
    invitationsGenerated: row.invitationsGenerated,
    ticketsSold: row.ticketsSold,
    commissionFcfa: row.commissionFcfa,
  };
}

export function mapWalletSummary(row: {
  availableFcfa?: number;
  pendingFcfa?: number;
  withdrawnFcfa?: number;
}): PartnerWalletSummary {
  return {
    availableFcfa: Number(row.availableFcfa ?? 0),
    pendingFcfa: Number(row.pendingFcfa ?? 0),
    withdrawnFcfa: Number(row.withdrawnFcfa ?? 0),
  };
}

export function mapAnalytics(row: {
  clicks?: number;
  opens?: number;
  conversions?: number;
  invitations?: number;
  sales?: number;
  commissionFcfa?: number;
  campaigns?: number;
}): PartnerAnalyticsSnapshot {
  const clicks = Number(row.clicks ?? 0);
  const conversions = Number(row.conversions ?? 0);
  return {
    clicks,
    opens: Number(row.opens ?? 0),
    conversions,
    invitations: Number(row.invitations ?? 0),
    sales: Number(row.sales ?? 0),
    commissionFcfa: Number(row.commissionFcfa ?? 0),
    campaigns: Number(row.campaigns ?? 0),
    conversionRate: clicks > 0 ? Math.round((1000 * conversions) / clicks) / 10 : 0,
  };
}

export function mapWithdrawal(row: {
  id: string;
  amountFcfa: number;
  status: PartnerWithdrawalRequest['status'];
  requestedAt: string;
  processedAt?: string;
}): PartnerWithdrawalRequest {
  return {
    id: row.id,
    amountFcfa: row.amountFcfa,
    status: row.status,
    requestedAt: row.requestedAt,
    processedAt: row.processedAt,
  };
}
