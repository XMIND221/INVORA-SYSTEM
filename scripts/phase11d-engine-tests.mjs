import { strict as assert } from 'node:assert';

function inviterCommission(accessCount) {
  if (accessCount >= 501) return 125;
  if (accessCount >= 301) return 100;
  if (accessCount >= 101) return 75;
  if (accessCount >= 1) return 50;
  return 0;
}

function vendreCommission(price) {
  if (price >= 100000) return 500;
  if (price >= 50000) return 300;
  if (price >= 20000) return 200;
  if (price >= 10000) return 150;
  if (price >= 5000) return 100;
  return 0;
}

assert.equal(inviterCommission(50), 50);
assert.equal(inviterCommission(600), 125);
assert.equal(vendreCommission(8000), 100);
assert.equal(vendreCommission(120000), 500);

function walletAvailable(earned, withdrawn, pending) {
  return Math.max(earned - withdrawn - pending, 0);
}

assert.equal(walletAvailable(100000, 20000, 10000), 70000);

console.log('Phase 11D engine tests: OK');
