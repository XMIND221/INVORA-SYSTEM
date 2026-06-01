import { supabase } from '@/supabase/client';
import {
  buildWalletHistory,
  searchAccesses,
} from '@/features/engines/access.engine';
import { useAccessStore } from '@/store/access.store';
import { inviterService } from '@/services/inviter.service';
import { vendreService } from '@/services/vendre.service';
import type {
  InvoraAccess,
  WalletAnalyticsSnapshot,
  WalletHistoryEntry,
  WalletReconcileResult,
} from '@/types/access';

export async function reconcileUserWallet(input: {
  userId: string;
  phone?: string;
  email?: string;
}): Promise<WalletReconcileResult> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('reconcile_user_wallet', {
    p_user_id: input.userId,
    p_phone: input.phone ?? null,
    p_email: input.email ?? null,
  });

  if (!error && data && typeof data === 'object') {
    const row = data as Record<string, unknown>;
    useAccessStore.getState().reconcileWallet(input.userId, input.phone, input.email);
    return {
      userId: String(row.userId ?? input.userId),
      invitationsLinked: Number(row.invitationsLinked ?? 0),
      ticketsLinked: Number(row.ticketsLinked ?? 0),
    };
  }

  const linked = useAccessStore.getState().reconcileWallet(input.userId, input.phone, input.email);
  return {
    userId: input.userId,
    invitationsLinked: linked,
    ticketsLinked: 0,
  };
}

export async function claimAccess(publicToken: string, userId: string): Promise<void> {
  const { error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('claim_access', { p_public_token: publicToken, p_user_id: userId });
  if (error) {
    inviterService.claim(publicToken, userId);
    void vendreService.reconcileUser(userId);
  }
}

export const accessService = {
  getWalletUserId: () => useAccessStore.getState().walletUserId,
  setWalletUserId: (id: string) => useAccessStore.getState().setWalletUserId(id),
  listAccesses: (userId?: string): InvoraAccess[] => {
    const uid = userId ?? useAccessStore.getState().walletUserId;
    return useAccessStore.getState().buildUnifiedAccesses(uid);
  },
  getAccess: (accessId: string, userId?: string): InvoraAccess | undefined => {
    return accessService.listAccesses(userId).find((a) => a.accessId === accessId);
  },
  search: (query: string, userId?: string): InvoraAccess[] => {
    return searchAccesses(accessService.listAccesses(userId), query);
  },
  history: (userId?: string): WalletHistoryEntry[] => {
    return buildWalletHistory(accessService.listAccesses(userId));
  },
  analytics: (userId?: string): WalletAnalyticsSnapshot => {
    const uid = userId ?? useAccessStore.getState().walletUserId;
    return useAccessStore.getState().analytics(uid);
  },
  reconcile: reconcileUserWallet,
  claim: claimAccess,
  notifications: () => useAccessStore.getState().notifications,
};
