import { create } from 'zustand';
import type {
  PartnerCampaign,
  PartnerCommissionQuote,
  PartnerProfile,
  PartnerWalletSummary,
  PartnerWithdrawalRequest,
} from '@/types/partner';
import type { PartnerUniverse } from '@/types/partner';
import {
  computePartnerAnalytics,
  computeWalletSummary,
  recordTrackingEvent,
} from '@/features/engines/partner.engine';
import {
  MOCK_PARTNER_CAMPAIGNS,
  MOCK_PARTNER_PROFILE,
  MOCK_PARTNER_WITHDRAWALS,
} from '@/integration/lovable/partner-mock';

interface PartnerState {
  profile: PartnerProfile;
  campaigns: PartnerCampaign[];
  withdrawals: PartnerWithdrawalRequest[];
  availableBalanceFcfa: number;

  getProfile: () => PartnerProfile;
  listCampaigns: () => PartnerCampaign[];
  getCampaign: (id: string) => PartnerCampaign | undefined;
  track: (campaignId: string, kind: 'click' | 'open' | 'conversion') => void;

  /** Quote depuis fixture (prod: partnerService.fetchCommissionQuote → RPC) */
  previewCommission: (universe: PartnerUniverse, metric: number) => PartnerCommissionQuote;

  requestWithdrawal: (amountFcfa: number) => PartnerWithdrawalRequest | { error: string };
  walletSummary: () => PartnerWalletSummary;
  analytics: () => ReturnType<typeof computePartnerAnalytics>;
}

function inviterFixture(metric: number): number {
  if (metric >= 501) return 125;
  if (metric >= 301) return 100;
  if (metric >= 101) return 75;
  if (metric >= 1) return 50;
  return 0;
}

function vendreFixture(metric: number): number {
  if (metric >= 100000) return 500;
  if (metric >= 50000) return 300;
  if (metric >= 20000) return 200;
  if (metric >= 10000) return 150;
  if (metric >= 5000) return 100;
  return 0;
}

export const usePartnerStore = create<PartnerState>((set, get) => ({
  profile: MOCK_PARTNER_PROFILE,
  campaigns: [...MOCK_PARTNER_CAMPAIGNS],
  withdrawals: [...MOCK_PARTNER_WITHDRAWALS],
  availableBalanceFcfa: 84050,

  getProfile: () => get().profile,
  listCampaigns: () => get().campaigns,
  getCampaign: (id) => get().campaigns.find((c) => c.id === id),

  track: (campaignId, kind) =>
    set((s) => ({ campaigns: recordTrackingEvent(s.campaigns, campaignId, kind) })),

  previewCommission: (universe, metric) => ({
    universe,
    metric,
    commissionFcfa: universe === 'inviter' ? inviterFixture(metric) : vendreFixture(metric),
  }),

  requestWithdrawal: (amountFcfa) => {
    const summary = get().walletSummary();
    if (amountFcfa > summary.availableFcfa) return { error: 'insufficient_balance' };
    const req: PartnerWithdrawalRequest = {
      id: crypto.randomUUID(),
      amountFcfa,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    set((s) => ({
      withdrawals: [req, ...s.withdrawals],
      availableBalanceFcfa: s.availableBalanceFcfa - amountFcfa,
    }));
    return req;
  },

  walletSummary: () => {
    const s = get();
    return computeWalletSummary(
      s.availableBalanceFcfa,
      s.withdrawals,
      s.withdrawals,
    );
  },

  analytics: () => computePartnerAnalytics(get().campaigns),
}));
