import type { CheckoutUniverse, PaymentStatus } from '@/types/payments';

const TERMINAL: PaymentStatus[] = ['paid', 'failed', 'expired', 'cancelled', 'refunded'];

export function isTerminalPaymentStatus(status: PaymentStatus): boolean {
  return TERMINAL.includes(status);
}

export function canDistributeAfterPayment(status: PaymentStatus): boolean {
  return status === 'paid';
}

export function formatFcfa(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount) + ' FCFA';
}

export function checkoutTitleForUniverse(universe: CheckoutUniverse): string {
  switch (universe) {
    case 'inviter':
      return 'Paiement invitations';
    case 'vendre':
    case 'ticketing':
      return 'Paiement billetterie';
    case 'organizer':
      return 'Paiement organisateur';
    case 'guest':
      return 'Paiement accès';
    case 'service':
      return 'Paiement service';
    default:
      return 'Paiement sécurisé';
  }
}

export function validateProviderAmount(expected: number, received: number): boolean {
  return expected === received && expected > 0;
}

export function buildIdempotencyKey(prefix: string, transactionId: string): string {
  return `${prefix}:${transactionId}:${crypto.randomUUID().slice(0, 8)}`;
}
