import { supabase } from '@/supabase/client';
import {
  mockConfirmPayment,
  mockInitiateCheckout,
  mockListProviders,
  mockReconcile,
} from '@/integration/lovable/payment-mock';
import type {
  CheckoutInitResult,
  PaymentConfirmResult,
  PaymentProvider,
  ReconciliationResult,
  RefundRequest,
} from '@/types/payments';

const USE_MOCK = import.meta.env.VITE_PAYMENTS_MOCK !== 'false';

function mapProvider(row: {
  id: string;
  display_name: string;
  provider_type: string;
  is_active: boolean;
  phase: number;
}): PaymentProvider {
  return {
    id: row.id,
    displayName: row.display_name,
    providerType: row.provider_type as PaymentProvider['providerType'],
    isActive: row.is_active,
    phase: row.phase as 1 | 2,
  };
}

export async function listPaymentProviders(phase = 1): Promise<PaymentProvider[]> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('list_payment_providers', { p_phase: phase });

  if (!error && Array.isArray(data) && data.length > 0) {
    return (data as { id: string; display_name: string; provider_type: string; is_active: boolean; phase: number }[]).map(
      mapProvider,
    );
  }
  return mockListProviders();
}

export async function initiateInviterCheckout(
  eventId: string,
  quantity: number,
  providerId: string,
): Promise<CheckoutInitResult | { error: string }> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('create_inviter_checkout', {
    p_event_id: eventId,
    p_quantity: quantity,
    p_provider_id: providerId,
  });

  if (!error && data && typeof data === 'object') {
    const row = data as Record<string, unknown>;
    return {
      transactionId: String(row.transactionId),
      paymentAttemptId: String(row.paymentAttemptId),
      amountFcfa: Number(row.amountFcfa),
      currency: String(row.currency ?? 'XOF'),
      checkoutUrl: String(row.checkoutUrl),
      expiresAt: row.expiresAt ? String(row.expiresAt) : undefined,
      quote: row.quote as Record<string, unknown> | undefined,
    };
  }

  if (USE_MOCK) {
    return mockInitiateCheckout({ universe: 'inviter', amountFcfa: quantity * 950, providerId });
  }
  return { error: error?.message ?? 'checkout_failed' };
}

export async function initiateVendreCheckout(input: {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  buyerName: string;
  buyerPhone: string;
  buyerEmail?: string;
  providerId: string;
}): Promise<CheckoutInitResult | { error: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('payment-initiate', { body: input });
    if (!error && data?.checkout) return data.checkout as CheckoutInitResult;
  } catch {
    /* fallback RPC */
  }

  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('initiate_vendre_checkout', {
    p_event_id: input.eventId,
    p_ticket_type_id: input.ticketTypeId,
    p_quantity: input.quantity,
    p_buyer_name: input.buyerName,
    p_buyer_phone: input.buyerPhone,
    p_buyer_email: input.buyerEmail ?? null,
    p_provider_id: input.providerId,
  });

  if (!error && data && typeof data === 'object') {
    const row = data as Record<string, unknown>;
    return {
      transactionId: String(row.transactionId),
      paymentAttemptId: String(row.paymentAttemptId),
      amountFcfa: Number(row.amountFcfa),
      currency: String(row.currency ?? 'XOF'),
      checkoutUrl: String(row.checkoutUrl),
    };
  }

  if (USE_MOCK) {
    return mockInitiateCheckout({ universe: 'vendre', amountFcfa: 5000 * input.quantity, providerId: input.providerId });
  }
  return { error: error?.message ?? 'checkout_failed' };
}

/** Simulation dev : déclenche webhook → confirmation backend */
export async function simulateProviderConfirmation(
  paymentAttemptId: string,
  providerId: string,
  amountFcfa: number,
): Promise<PaymentConfirmResult | { error: string }> {
  if (USE_MOCK) {
    const mock = mockConfirmPayment(paymentAttemptId);
    if (mock) return mock;
  }

  const { data, error } = await supabase.functions.invoke('payment-simulate-confirm', {
    body: { paymentAttemptId, providerId, amountFcfa },
  });
  if (!error && data?.result) return data.result as PaymentConfirmResult;

  return { error: error?.message ?? 'confirm_failed' };
}

export async function reconcilePayment(paymentAttemptId: string): Promise<ReconciliationResult | null> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('reconcile_payment_attempt', { p_payment_attempt_id: paymentAttemptId });

  if (!error && data && typeof data === 'object') {
    const row = data as Record<string, unknown>;
    const tokens = row.ticketTokens as ReconciliationResult['ticketTokens'];
    return {
      paymentAttemptId: String(row.paymentAttemptId),
      transactionId: row.transactionId ? String(row.transactionId) : undefined,
      expectedFcfa: Number(row.expectedFcfa),
      receivedFcfa: Number(row.receivedFcfa),
      deltaFcfa: Number(row.deltaFcfa),
      attemptStatus: row.attemptStatus as ReconciliationResult['attemptStatus'],
      paymentStatus: String(row.paymentStatus),
      provider: String(row.provider),
      providerRef: row.providerRef ? String(row.providerRef) : undefined,
      reconciled: Boolean(row.reconciled),
      primaryTicketToken: row.primaryTicketToken ? String(row.primaryTicketToken) : undefined,
      ticketTokens: Array.isArray(tokens) ? tokens : undefined,
    };
  }
  return mockReconcile(paymentAttemptId);
}

export async function requestRefund(req: RefundRequest): Promise<string | { error: string }> {
  const { data, error } = await (
    supabase.rpc as (fn: string, args: Record<string, unknown>) => ReturnType<typeof supabase.rpc>
  )('create_payment_refund', {
    p_payment_id: req.paymentId,
    p_amount_fcfa: req.amountFcfa,
    p_reason: req.reason ?? null,
    p_is_partial: req.isPartial ?? false,
  });

  if (!error && data) return String(data);
  return { error: error?.message ?? 'refund_failed' };
}
