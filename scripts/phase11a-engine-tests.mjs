import { strict as assert } from 'node:assert';

function journeyStepFromStatus(status) {
  const map = { draft: 0, scheduled: 1, published: 2, live: 3, ended: 4, archived: 4 };
  return map[status] ?? 1;
}

assert.equal(journeyStepFromStatus('draft'), 0);
assert.equal(journeyStepFromStatus('published'), 2);

function slugShape(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

assert.ok(slugShape('Obsidian Gala').includes('obsidian'));

console.log('Phase 11A engine tests: OK');
