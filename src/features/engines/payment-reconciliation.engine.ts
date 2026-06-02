import type { ReconciliationResult } from '@/types/payments';

export function reconciliationHasAnomaly(result: ReconciliationResult): boolean {
  return !result.reconciled || result.deltaFcfa !== 0;
}

export function reconciliationSummary(result: ReconciliationResult): string {
  if (result.reconciled) return 'Paiement réconcilié.';
  if (result.deltaFcfa !== 0) {
    return `Écart de ${result.deltaFcfa} FCFA entre attendu et reçu.`;
  }
  return `Statut tentative : ${result.attemptStatus}, paiement : ${result.paymentStatus}.`;
}
