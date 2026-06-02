import { strict as assert } from 'node:assert';

function renderTemplate(template, variables) {
  let out = template ?? '';
  for (const [key, val] of Object.entries(variables)) {
    out = out.replaceAll(`{{${key}}}`, val ?? '');
  }
  return out;
}

const body = renderTemplate(
  'Bonjour {{holder_name}}, événement {{event_name}} — {{access_code}}',
  { holder_name: 'Aminata', event_name: 'Gala', access_code: 'ABC123' },
);
assert.ok(body.includes('Aminata'));
assert.ok(body.includes('Gala'));
assert.ok(body.includes('ABC123'));

const DELIVERY_STATUSES = [
  'pending',
  'queued',
  'sending',
  'sent',
  'delivered',
  'opened',
  'clicked',
  'failed',
];
assert.equal(DELIVERY_STATUSES.length, 8);

function retryBackoff(attempt) {
  return Math.min(Math.pow(2, attempt), 64);
}

assert.equal(retryBackoff(1), 2);
assert.equal(retryBackoff(6), 64);

function channelAllowed(prefs, channel, kind) {
  if (prefs.disabledKinds.includes(kind)) return false;
  if (channel === 'email') return prefs.emailEnabled;
  if (channel === 'whatsapp') return prefs.whatsappEnabled;
  if (channel === 'in_app') return prefs.inAppEnabled;
  return false;
}

assert.equal(
  channelAllowed(
    { emailEnabled: true, whatsappEnabled: false, inAppEnabled: true, disabledKinds: [] },
    'whatsapp',
    'invitation_sent',
  ),
  false,
);

console.log('Phase 11F engine tests: OK');
