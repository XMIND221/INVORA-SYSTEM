/**
 * Invoke notification-dispatch Edge Function (service_role).
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run notifications:dispatch
 */

const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const cronSecret = process.env.NOTIFICATION_CRON_SECRET;

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${key}`,
};
if (cronSecret) headers['x-invora-cron-secret'] = cronSecret;

const res = await fetch(`${url}/functions/v1/notification-dispatch`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ limit: 40 }),
});

const text = await res.text();
let json;
try {
  json = JSON.parse(text);
} catch {
  json = { raw: text };
}

if (!res.ok) {
  console.error('Dispatch failed:', res.status, json);
  process.exit(1);
}

console.log('Notification dispatch OK:', JSON.stringify(json, null, 2));
