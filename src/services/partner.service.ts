import { supabase } from '@/supabase/client';
import {
  mapAnalytics,
  mapPartnerCampaign,
  mapPartnerProfile,
  mapWalletSummary,
  mapWithdrawal,
} from '@/lib/partner-mapper';
import { visitorKey } from '@/lib/partner-attribution';
import type {
  PartnerAnalyticsSnapshot,
  PartnerCampaign,
  PartnerCommissionQuote,
  PartnerMediaAsset,
  PartnerProfile,
  PartnerUniverse,
  PartnerWalletSummary,
  PartnerWithdrawalRequest,
} from '@/types/partner';

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

  throw new Error('commission_quote_unavailable');
}

export async function ensurePartnerProfile(userId: string): Promise<PartnerProfile | null> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('get_or_create_partner_for_user', { p_user_id: userId });

  if (error || !data || typeof data !== 'object') return null;
  const row = data as Record<string, string>;
  return mapPartnerProfile({
    id: String(row.id),
    userId: String(row.userId),
    partnerCode: String(row.partnerCode),
    displayId: String(row.displayId),
  });
}

export type PartnerDashboardPayload = {
  profile: PartnerProfile | null;
  campaigns: PartnerCampaign[];
  wallet: PartnerWalletSummary;
  analytics: PartnerAnalyticsSnapshot;
};

export async function fetchPartnerDashboard(userId: string): Promise<PartnerDashboardPayload> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('get_partner_dashboard', { p_user_id: userId });

  if (error) throw error;

  const row = (data ?? {}) as Record<string, unknown>;
  const profileRaw = row.profile as Record<string, string> | null;
  const campaignsRaw = (row.campaigns ?? []) as Parameters<typeof mapPartnerCampaign>[0][];
  const walletRaw = (row.wallet ?? {}) as Record<string, number>;
  const analyticsRaw = (row.analytics ?? {}) as Record<string, number>;

  const profile = profileRaw
    ? mapPartnerProfile({
        id: String(profileRaw.id ?? ''),
        userId: String(profileRaw.userId ?? ''),
        partnerCode: String(profileRaw.partnerCode ?? ''),
        displayId: String(profileRaw.displayId ?? ''),
      })
    : null;

  const campaigns = (Array.isArray(campaignsRaw) ? campaignsRaw : []).map((c) => {
    const row = c as Parameters<typeof mapPartnerCampaign>[0];
    return mapPartnerCampaign({
      ...row,
      partnerCode: profile?.partnerCode,
      sharePath: row.sharePath ?? `/p/${profile?.partnerCode}/${row.eventId}`,
    });
  });

  return {
    profile,
    campaigns,
    wallet: mapWalletSummary(walletRaw),
    analytics: mapAnalytics(analyticsRaw),
  };
}

export async function recordPartnerClick(partnerCode: string, eventKey: string): Promise<{
  campaignCode: string;
  eventId: string;
  universe: PartnerUniverse;
}> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('record_partner_click', {
    p_partner_code: partnerCode,
    p_event_key: eventKey,
    p_visitor_key: visitorKey(),
    p_utm: { medium: 'share', source: 'partner' },
    p_source: 'redirect',
  });

  if (error) throw error;
  const row = data as Record<string, string>;
  return {
    campaignCode: String(row.campaignCode),
    eventId: String(row.eventId),
    universe: row.universe as PartnerUniverse,
  };
}

export async function recordPartnerOpen(campaignCode: string): Promise<void> {
  await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('record_partner_open', { p_campaign_code: campaignCode });
}

export async function attributeVendreSale(
  transactionId: string,
  campaignCode: string,
  ticketPriceFcfa?: number,
): Promise<void> {
  await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('attribute_partner_vendre_sale', {
    p_transaction_id: transactionId,
    p_campaign_code: campaignCode,
    p_ticket_price_fcfa: ticketPriceFcfa ?? null,
  });
}

export async function recordPartnerConversion(
  campaignCode: string,
  referenceType: string,
  referenceId: string,
  metric: number,
  transactionId?: string,
): Promise<void> {
  await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('record_partner_conversion', {
    p_campaign_code: campaignCode,
    p_reference_type: referenceType,
    p_reference_id: referenceId,
    p_metric: metric,
    p_transaction_id: transactionId ?? null,
    p_source: 'app',
  });
}

export async function listPartnerWithdrawals(partnerId: string): Promise<PartnerWithdrawalRequest[]> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('list_partner_withdrawals', { p_partner_id: partnerId });

  if (error) throw error;
  const rows = (Array.isArray(data) ? data : []) as Parameters<typeof mapWithdrawal>[0][];
  return rows.map(mapWithdrawal);
}

export async function requestPartnerWithdrawal(
  partnerId: string,
  amountFcfa: number,
): Promise<string> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('create_partner_withdrawal_request', {
    p_partner_id: partnerId,
    p_amount_fcfa: amountFcfa,
  });

  if (error) throw error;
  return String(data);
}

export async function fetchPartnerMediaKit(eventId: string): Promise<PartnerMediaAsset[]> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('list_partner_media_kit', { p_event_id: eventId });

  if (error) throw error;
  const rows = (Array.isArray(data) ? data : []) as unknown as PartnerMediaAsset[];
  return rows;
}

export async function ensureCampaignForEvent(partnerId: string, eventId: string): Promise<string> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('ensure_partner_campaign', { p_partner_id: partnerId, p_event_id: eventId });

  if (error) throw error;
  return String(data);
}

export const partnerService = {
  ensureProfile: ensurePartnerProfile,
  fetchDashboard: fetchPartnerDashboard,
  fetchCommissionQuote: fetchPartnerCommissionQuote,
  recordClick: recordPartnerClick,
  recordOpen: recordPartnerOpen,
  attributeVendreSale,
  recordConversion: recordPartnerConversion,
  listWithdrawals: listPartnerWithdrawals,
  requestWithdrawal: requestPartnerWithdrawal,
  fetchMediaKit: fetchPartnerMediaKit,
  ensureCampaign: ensureCampaignForEvent,
};
