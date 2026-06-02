import { strict as assert } from 'node:assert';

function mapTicketStatus(scannedAt, paymentStatus, claimed) {
  if (scannedAt) return 'used';
  if (paymentStatus === 'refunded' || paymentStatus === 'failed') return 'cancelled';
  if (paymentStatus !== 'paid') return 'created';
  if (claimed) return 'claimed';
  return 'distributed';
}

assert.equal(mapTicketStatus(null, 'paid', false), 'distributed');
assert.equal(mapTicketStatus('2026-01-01', 'paid', true), 'used');
assert.equal(mapTicketStatus(null, 'pending', false), 'created');

function checkoutSuccessPath(paid, token) {
  if (!paid) return '/';
  return token ? `/ticket/${token}` : '/paiement/statut/x';
}

assert.equal(checkoutSuccessPath(true, 'abc123'), '/ticket/abc123');
assert.equal(checkoutSuccessPath(false, 'abc'), '/');

console.log('Phase 11B engine tests: OK');
