import { strict as assert } from 'node:assert';

function decodeScannedText(raw) {
  return raw.trim();
}

function mapDisplayToResult(display) {
  if (display === 'VALID') return 'valid';
  if (display === 'USED') return 'duplicate';
  if (display === 'EXPIRED') return 'expired';
  return 'invalid';
}

const GATES = {
  main: 'Entrée principale',
  vip: 'VIP',
  backstage: 'Backstage',
};

function gateLabel(code) {
  return GATES[code] ?? code;
}

assert.equal(decodeScannedText('  tk-abc  '), 'tk-abc');
assert.equal(mapDisplayToResult('VALID'), 'valid');
assert.equal(mapDisplayToResult('USED'), 'duplicate');
assert.equal(mapDisplayToResult('EXPIRED'), 'expired');
assert.equal(mapDisplayToResult('REFUNDED'), 'invalid');
assert.equal(mapDisplayToResult('UNKNOWN'), 'invalid');
assert.equal(gateLabel('main'), 'Entrée principale');
assert.equal(gateLabel('custom'), 'custom');

const DISPLAY_STATUSES = [
  'VALID',
  'USED',
  'EXPIRED',
  'CANCELLED',
  'REFUNDED',
  'BLOCKED',
  'UNKNOWN',
];
assert.equal(DISPLAY_STATUSES.length, 7);

console.log('Phase 11E engine tests: OK');
