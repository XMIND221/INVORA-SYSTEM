import type { EventUniverse } from '@/types/event';
import type {
  PartnerAnalyticsSnapshot,
  PartnerCampaign,
  PartnerTrackingKind,
  PartnerWalletSummary,
  PartnerWithdrawalRequest,
  PartnerWithdrawalStatus,
} from '@/types/partner';

export const PARTNER_WORKFLOW = [
  { key: 'promouvoir', label: 'Promouvoir' },
  { key: 'distribuer', label: 'Distribuer' },
  { key: 'partager', label: 'Partager' },
  { key: 'gagner', label: 'Gagner' },
  { key: 'retirer', label: 'Retirer' },
  { key: 'analyser', label: 'Analyser' },
] as const;

export const WITHDRAWAL_STATUS_LABEL: Record<PartnerWithdrawalStatus, string> = {
  pending: 'En attente',
  approved: 'Validé',
  paid: 'Retiré',
  rejected: 'Refusé',
};

export function buildPartnerSharePath(partnerCode: string, eventId: string): string {
  return `/p/${partnerCode}/${eventId}`;
}

export function buildPartnerShareLink(baseUrl: string, partnerCode: string, eventId: string): string {
  return `${baseUrl}${buildPartnerSharePath(partnerCode, eventId)}`;
}

export function buildCampaignCode(partnerCode: string, eventId: string): string {
  return `${partnerCode}-${eventId.replace(/-/g, '').slice(0, 8)}`.toUpperCase();
}

export function assertPartnerRole(role: string): void {
  if (role !== 'partenaire') throw new Error('not_partner_role');
}

export function recordTrackingEvent(
  campaigns: PartnerCampaign[],
  campaignId: string,
  kind: PartnerTrackingKind,
): PartnerCampaign[] {
  return campaigns.map((c) => {
    if (c.id !== campaignId) return c;
    return {
      ...c,
      clicks: kind === 'click' ? c.clicks + 1 : c.clicks,
      opens: kind === 'open' ? c.opens + 1 : c.opens,
      conversions: kind === 'conversion' ? c.conversions + 1 : c.conversions,
    };
  });
}

export function computePartnerAnalytics(campaigns: PartnerCampaign[]): PartnerAnalyticsSnapshot {
  return {
    clicks: campaigns.reduce((s, c) => s + c.clicks, 0),
    opens: campaigns.reduce((s, c) => s + c.opens, 0),
    conversions: campaigns.reduce((s, c) => s + c.conversions, 0),
    invitations: campaigns.reduce((s, c) => s + c.invitationsGenerated, 0),
    sales: campaigns.reduce((s, c) => s + c.ticketsSold, 0),
    commissionFcfa: campaigns.reduce((s, c) => s + c.commissionFcfa, 0),
    campaigns: campaigns.filter((c) => c.isActive).length,
  };
}

export function computeWalletSummary(
  availableFcfa: number,
  pendingWithdrawals: PartnerWithdrawalRequest[],
  paidWithdrawals: PartnerWithdrawalRequest[],
): PartnerWalletSummary {
  const pendingFcfa = pendingWithdrawals
    .filter((w) => w.status === 'pending' || w.status === 'approved')
    .reduce((s, w) => s + w.amountFcfa, 0);
  const withdrawnFcfa = paidWithdrawals
    .filter((w) => w.status === 'paid')
    .reduce((s, w) => s + w.amountFcfa, 0);

  return {
    availableFcfa: Math.max(0, availableFcfa - pendingFcfa),
    pendingFcfa,
    withdrawnFcfa,
  };
}

export function getPartnerRayonnerPhases(): import('@/types/partner').PartnerRayonnerPhase[] {
  return [
    {
      key: 'avant',
      label: 'Avant',
      description: 'Teasing & diffusion',
      actions: ['Stories', 'Affiches', 'Liens traçables'],
    },
    {
      key: 'pendant',
      label: 'Pendant',
      description: 'Live & conversions',
      actions: ['QR entrée', 'Posts live', 'Relances WhatsApp'],
    },
    {
      key: 'apres',
      label: 'Après',
      description: 'RAYONNER — bilan',
      actions: ['Résultats', 'Remerciements', 'Photos', 'Albums', 'Bilan événement'],
    },
  ];
}

export function distributionLabelForUniverse(universe: EventUniverse): string {
  return universe === 'inviter'
    ? 'Invitations · VIP · Corporate · Famille · Presse · Staff'
    : 'Billets · Page de vente · Offres · Liens publics';
}
