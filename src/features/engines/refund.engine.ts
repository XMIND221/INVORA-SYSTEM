export function validateRefundAmount(paymentAmount: number, refundAmount: number): {
  valid: boolean;
  error?: string;
} {
  if (refundAmount <= 0) return { valid: false, error: 'Montant invalide' };
  if (refundAmount > paymentAmount) return { valid: false, error: 'Remboursement supérieur au paiement' };
  return { valid: true };
}

export function isFullRefund(paymentAmount: number, refundAmount: number): boolean {
  return refundAmount >= paymentAmount;
}
