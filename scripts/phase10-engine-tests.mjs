import { strict as assert } from 'node:assert';

function isTerminalPaymentStatus(status) {
  return ['paid', 'failed', 'expired', 'cancelled', 'refunded'].includes(status);
}

function validateRefundAmount(paymentAmount, refundAmount) {
  if (refundAmount <= 0) return { valid: false };
  if (refundAmount > paymentAmount) return { valid: false };
  return { valid: true };
}

function webhookIdempotencyKey(providerId, providerEventId) {
  return `${providerId}:${providerEventId}`;
}

assert.equal(isTerminalPaymentStatus('paid'), true);
assert.equal(isTerminalPaymentStatus('pending'), false);
assert.equal(validateRefundAmount(1000, 500).valid, true);
assert.equal(validateRefundAmount(1000, 1001).valid, false);
assert.equal(webhookIdempotencyKey('stripe', 'evt_1'), 'stripe:evt_1');

console.log('Phase 10 engine tests: OK');
