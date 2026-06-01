import type { BalanceSummary, FinanceLedgerRow, InviterPricingQuote } from '@/types/finance';

/** Affichage uniquement — aucun calcul de tarification. */
export function formatFcfa(amount: number): string {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} FCFA`;
}

export function formatFcfaShort(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}k`;
  return String(amount);
}

export const PAYOUT_STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  approved: 'Validé',
  paid: 'Retiré',
  rejected: 'Refusé',
};

export function ledgerRowLabel(row: FinanceLedgerRow): string {
  if (row.universe === 'inviter') return 'INVITER';
  if (row.universe === 'vendre') return 'VENDRE';
  return row.reference ?? 'Opération';
}

export function balanceHeadline(summary: BalanceSummary): string {
  return formatFcfa(summary.availableFcfa);
}

export function inviterQuoteSummary(quote: InviterPricingQuote): string {
  if (quote.quantity === 0) {
    return `Palier ${quote.tierLabel} · ${formatFcfa(quote.unitPriceFcfa)} / accès`;
  }
  return `${formatFcfa(quote.totalFcfa)} · ${quote.quantity} accès`;
}

/** Export CSV — préparation (pas de calcul). */
export function financeReportToCsv(rows: FinanceLedgerRow[]): string {
  const header = 'date,reference,univers,brut,commission_invora,partenaire,net_organisateur,statut';
  const lines = rows.map((r) =>
    [
      r.at,
      r.reference ?? '',
      r.universe ?? '',
      r.grossFcfa ?? '',
      r.invoraCommissionFcfa ?? r.commissionFcfa ?? '',
      r.partnerCommissionFcfa ?? '',
      r.organizerNetFcfa ?? '',
      r.status ?? '',
    ].join(','),
  );
  return [header, ...lines].join('\n');
}
