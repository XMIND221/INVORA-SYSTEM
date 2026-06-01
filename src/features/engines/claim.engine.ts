import type { InvoraAccess } from '@/types/access';

/** Claim Engine — orchestration UI uniquement (claim via RPC claim_access). */

export function canClaimAccess(access: InvoraAccess): boolean {
  if (access.claimed && access.userId) return false;
  return !['cancelled', 'expired', 'used'].includes(access.status);
}

export function claimStatusLabel(access: InvoraAccess): string {
  if (access.claimed) return 'Réclamé';
  return 'Non réclamé';
}
