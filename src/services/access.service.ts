import { supabase } from '@/supabase/client';
import {
  buildWalletHistory,
  computeWalletAnalytics,
  inviterGuestToAccess,
} from '@/features/engines/access.engine';
import { useInviterStore } from '@/store/inviter.store';
import type {
  InvoraAccess,
  WalletAnalyticsSnapshot,
  WalletHistoryEntry,
  WalletReconcileResult,
} from '@/types/access';
import {
  getWalletAnalytics,
  listUserWalletAccesses,
  searchUserWalletAccesses,
} from '@/services/wallet.service';
import { inviterService } from '@/services/inviter.service';

function inviterAccessesForUser(userId: string): InvoraAccess[] {
  const guests = useInviterStore.getState().walletGuestsForUser(userId);
  return guests.map((g) =>
    inviterGuestToAccess(g, {
      eventTitle: g.eventId,
      accessTypeLabel: g.accessTypeCode,
    }),
  );
}

async function mergeWalletRows(userId: string, db: InvoraAccess[]): Promise<InvoraAccess[]> {
  const inviter = inviterAccessesForUser(userId);
  const ids = new Set(db.map((a) => a.accessId));
  const extra = inviter.filter((a) => !ids.has(a.accessId));
  return [...db, ...extra].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

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

  if (error) throw error;
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    userId: String(row.userId ?? input.userId),
    invitationsLinked: Number(row.invitationsLinked ?? 0),
    ticketsLinked: Number(row.ticketsLinked ?? 0),
  };
}

export async function claimAccess(publicToken: string, userId: string): Promise<void> {
  const { error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('claim_access', { p_public_token: publicToken, p_user_id: userId });

  if (error && !error.message.includes('invitation')) {
    throw error;
  }
  if (error) {
    inviterService.claim(publicToken, userId);
  }
}

export const accessService = {
  async listAccesses(userId: string): Promise<InvoraAccess[]> {
    const rows = await listUserWalletAccesses(userId);
    return mergeWalletRows(userId, rows);
  },

  async getAccess(accessId: string, userId: string): Promise<InvoraAccess | undefined> {
    const list = await accessService.listAccesses(userId);
    return list.find((a) => a.accessId === accessId);
  },

  async search(query: string, userId: string): Promise<InvoraAccess[]> {
    const rows = await searchUserWalletAccesses(userId, query);
    return rows;
  },

  async history(userId: string): Promise<WalletHistoryEntry[]> {
    return buildWalletHistory(await accessService.listAccesses(userId));
  },

  async analytics(userId: string): Promise<WalletAnalyticsSnapshot> {
    try {
      return await getWalletAnalytics(userId);
    } catch {
      return computeWalletAnalytics(await accessService.listAccesses(userId));
    }
  },

  reconcile: reconcileUserWallet,
  claim: claimAccess,
};
