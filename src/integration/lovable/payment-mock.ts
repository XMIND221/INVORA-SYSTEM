import type {
  CheckoutInitResult,
  PaymentConfirmResult,
  PaymentProvider,
  ReconciliationResult,
} from '@/types/payments';

const PROVIDERS: PaymentProvider[] = [
  { id: 'wave', displayName: 'Wave', providerType: 'mobile_money', isActive: true, phase: 1 },
  { id: 'orange_money', displayName: 'Orange Money', providerType: 'mobile_money', isActive: true, phase: 1 },
  { id: 'free_money', displayName: 'Free Money', providerType: 'mobile_money', isActive: true, phase: 1 },
  { id: 'stripe', displayName: 'Stripe', providerType: 'card', isActive: true, phase: 1 },
  { id: 'card', displayName: 'Carte bancaire', providerType: 'card', isActive: true, phase: 1 },
];

const attempts = new Map<string, CheckoutInitResult & { providerId: string; status: string }>();

export function mockListProviders(): PaymentProvider[] {
  return PROVIDERS;
}

export function mockInitiateCheckout(input: {
  universe: 'inviter' | 'vendre';
  amountFcfa: number;
  providerId: string;
  transactionId?: string;
}): CheckoutInitResult {
  const paymentAttemptId = crypto.randomUUID();
  const transactionId = input.transactionId ?? crypto.randomUUID();
  const result: CheckoutInitResult = {
    transactionId,
    paymentAttemptId,
    amountFcfa: input.amountFcfa,
    currency: 'XOF',
    checkoutUrl: `/checkout/${paymentAttemptId}`,
    expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
  };
  attempts.set(paymentAttemptId, { ...result, providerId: input.providerId, status: 'pending' });
  return result;
}

export function mockConfirmPayment(paymentAttemptId: string): PaymentConfirmResult | null {
  const a = attempts.get(paymentAttemptId);
  if (!a) return null;
  a.status = 'paid';
  return {
    status: 'paid',
    paymentAttemptId,
    transactionId: a.transactionId,
    paymentId: crypto.randomUUID(),
  };
}

export function mockReconcile(paymentAttemptId: string): ReconciliationResult | null {
  const a = attempts.get(paymentAttemptId);
  if (!a) return null;
  const paid = a.status === 'paid';
  return {
    paymentAttemptId,
    expectedFcfa: a.amountFcfa,
    receivedFcfa: paid ? a.amountFcfa : 0,
    deltaFcfa: paid ? 0 : a.amountFcfa,
    attemptStatus: paid ? 'paid' : 'pending',
    paymentStatus: paid ? 'paid' : 'none',
    provider: a.providerId,
    reconciled: paid,
  };
}
