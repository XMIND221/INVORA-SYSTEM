/** Logique webhook (validation côté Edge ; ici = helpers purs) */

export type WebhookEventType =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'charge.succeeded'
  | 'charge.failed'
  | 'checkout.completed'
  | 'unknown';

export function normalizeWebhookEventType(raw: string): WebhookEventType {
  const v = raw.toLowerCase();
  if (
    v === 'payment.succeeded' ||
    v === 'charge.succeeded' ||
    v === 'checkout.completed' ||
    v === 'payment_intent.succeeded'
  ) {
    return 'payment.succeeded';
  }
  if (v === 'payment.failed' || v === 'charge.failed') {
    return 'payment.failed';
  }
  return 'unknown';
}

export function isSuccessWebhook(type: WebhookEventType): boolean {
  return type === 'payment.succeeded' || type === 'charge.succeeded' || type === 'checkout.completed';
}

export function webhookIdempotencyKey(providerId: string, providerEventId: string): string {
  return `${providerId}:${providerEventId}`;
}

export function shouldRetryWebhook(retryCount: number, maxRetries = 5): boolean {
  return retryCount < maxRetries;
}
