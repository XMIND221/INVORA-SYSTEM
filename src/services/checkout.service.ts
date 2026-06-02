import { checkoutTitleForUniverse } from '@/features/engines/payments.engine';
import * as paymentService from '@/services/payment.service';
import type { CheckoutInitResult, CheckoutUniverse, PaymentProvider } from '@/types/payments';

export type CheckoutFlowInput =
  | {
      universe: 'vendre';
      eventId: string;
      ticketTypeId: string;
      quantity: number;
      buyerName: string;
      buyerPhone: string;
      buyerEmail?: string;
      providerId: string;
    }
  | {
      universe: 'inviter';
      eventId: string;
      quantity: number;
      providerId: string;
    };

export async function startCheckout(input: CheckoutFlowInput): Promise<CheckoutInitResult | { error: string }> {
  if (input.universe === 'vendre') {
    return paymentService.initiateVendreCheckout(input);
  }
  return paymentService.initiateInviterCheckout(input.eventId, input.quantity, input.providerId);
}

export async function completeCheckoutAfterProvider(
  paymentAttemptId: string,
  providerId: string,
  amountFcfa: number,
) {
  return paymentService.simulateProviderConfirmation(paymentAttemptId, providerId, amountFcfa);
}

export function checkoutPageTitle(universe: CheckoutUniverse): string {
  return checkoutTitleForUniverse(universe);
}

export async function loadProviders(): Promise<PaymentProvider[]> {
  return paymentService.listPaymentProviders(1);
}
