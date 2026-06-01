import { supabase } from '@/supabase/client';
import { usePartnerStore } from '@/store/partner.store';
import type { PartnerCommissionQuote, PartnerUniverse } from '@/types/partner';

type RpcCommissionRow = {
  universe: PartnerUniverse;
  metric: number;
  commission_fcfa: number;
};

function mapQuote(row: RpcCommissionRow): PartnerCommissionQuote {
  return {
    universe: row.universe,
    metric: row.metric,
    commissionFcfa: row.commission_fcfa,
  };
}

function fixtureQuote(universe: PartnerUniverse, metric: number): PartnerCommissionQuote {
  return usePartnerStore.getState().previewCommission(universe, metric);
}

/** Commission partenaire — RPC / Edge uniquement. */
export async function fetchPartnerCommissionQuote(
  universe: PartnerUniverse,
  metric: number,
): Promise<PartnerCommissionQuote> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('calculate_partner_commission', { p_universe: universe, p_metric: metric });

  if (!error && data) {
    const row = (Array.isArray(data) ? data[0] : data) as RpcCommissionRow;
    if (row) return mapQuote(row);
  }

  try {
    const { data: fnData, error: fnErr } = await supabase.functions.invoke(
      'calculate-partner-commission',
      { body: { universe, metric } },
    );
    if (!fnErr && fnData?.result) {
      return mapQuote(fnData.result as RpcCommissionRow);
    }
  } catch {
    /* offline */
  }

  return fixtureQuote(universe, metric);
}

export const partnerService = {
  getProfile: () => usePartnerStore.getState().getProfile(),
  listCampaigns: () => usePartnerStore.getState().listCampaigns(),
  getCampaign: (id: string) => usePartnerStore.getState().getCampaign(id),
  trackClick: (campaignId: string) => usePartnerStore.getState().track(campaignId, 'click'),
  trackOpen: (campaignId: string) => usePartnerStore.getState().track(campaignId, 'open'),
  analytics: () => usePartnerStore.getState().analytics(),
  walletSummary: () => usePartnerStore.getState().walletSummary(),
  requestWithdrawal: (amountFcfa: number) =>
    usePartnerStore.getState().requestWithdrawal(amountFcfa),
  fetchCommissionQuote: fetchPartnerCommissionQuote,
};
