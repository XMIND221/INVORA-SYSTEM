import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { dispatchItem, type DispatchItem } from '../_shared/notification-providers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceKey) {
      return new Response(JSON.stringify({ error: 'service_role_required' }), { status: 500 });
    }

    const bearer = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const cronSecret = Deno.env.get('NOTIFICATION_CRON_SECRET');
    const cronHeader = req.headers.get('x-invora-cron-secret');
    const authOk =
      bearer === serviceKey ||
      (cronSecret && cronSecret.length > 8 && cronHeader === cronSecret);

    if (!authOk) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    const body = (await req.json().catch(() => ({}))) as { limit?: number };
    const limit = Math.min(Math.max(body.limit ?? 40, 1), 100);

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', serviceKey);

    const { data: inAppResult, error: inAppErr } = await supabase.rpc(
      'process_notification_in_app_batch',
      { p_limit: 50 },
    );
    if (inAppErr) console.warn('in_app_batch', inAppErr.message);

    const { data: claimData, error: claimErr } = await supabase.rpc(
      'claim_notification_queue_batch',
      { p_limit: limit },
    );
    if (claimErr) throw claimErr;

    const items = ((claimData as { items?: DispatchItem[] })?.items ?? []) as DispatchItem[];
    let sent = 0;
    let failed = 0;

    for (const raw of items) {
      const item: DispatchItem = {
        queueId: String(raw.queueId),
        channel: String(raw.channel),
        recipientEmail: raw.recipientEmail,
        recipientPhone: raw.recipientPhone,
        subject: raw.subject,
        body: String(raw.body ?? ''),
      };

      const result = await dispatchItem(item);

      const { error: finErr } = await supabase.rpc('finalize_notification_dispatch', {
        p_queue_id: item.queueId,
        p_success: result.ok,
        p_provider: result.provider,
        p_provider_message_id: result.ok ? result.messageId : null,
        p_error: result.ok ? null : result.error,
      });

      if (finErr) {
        console.error('finalize', item.queueId, finErr.message);
        failed += 1;
        continue;
      }

      if (result.ok) sent += 1;
      else failed += 1;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        inApp: inAppResult,
        claimed: items.length,
        sent,
        failed,
        providers: {
          resend: Boolean(Deno.env.get('RESEND_API_KEY')),
          whatsapp: Boolean(
            Deno.env.get('WHATSAPP_ACCESS_TOKEN') && Deno.env.get('WHATSAPP_PHONE_NUMBER_ID'),
          ),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
