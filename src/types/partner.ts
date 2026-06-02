import type { EventUniverse } from '@/types/event';

export type PartnerUniverse = EventUniverse;

export type PartnerTrackingKind = 'click' | 'open' | 'conversion';

export type PartnerWithdrawalStatus = 'pending' | 'approved' | 'paid' | 'rejected';

/** Réponse serveur — commission partenaire (ne pas recalculer en React). */
export interface PartnerCommissionQuote {
  universe: PartnerUniverse;
  metric: number;
  commissionFcfa: number;
}

export interface PartnerProfile {
  id: string;
  userId: string;
  partnerCode: string;
  displayId: string;
}

export interface PartnerCampaign {
  id: string;
  eventId: string;
  eventTitle: string;
  dateLabel: string;
  universe: PartnerUniverse;
  campaignCode: string;
  shareLink: string;
  qrPath: string;
  isActive: boolean;
  clicks: number;
  opens: number;
  conversions: number;
  invitationsGenerated: number;
  ticketsSold: number;
  commissionFcfa: number;
}

export interface PartnerMediaAsset {
  key: string;
  label: string;
  description: string;
  format?: string;
}

export interface PartnerWalletSummary {
  availableFcfa: number;
  pendingFcfa: number;
  withdrawnFcfa: number;
}

export interface PartnerWithdrawalRequest {
  id: string;
  amountFcfa: number;
  status: PartnerWithdrawalStatus;
  requestedAt: string;
  processedAt?: string;
}

export interface PartnerAnalyticsSnapshot {
  clicks: number;
  opens: number;
  conversions: number;
  invitations: number;
  sales: number;
  commissionFcfa: number;
  campaigns: number;
  conversionRate?: number;
}

export interface PartnerRayonnerPhase {
  key: 'avant' | 'pendant' | 'apres';
  label: string;
  description: string;
  actions: string[];
}
