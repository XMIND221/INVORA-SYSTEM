import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as {
      providerId: string;
      providerEventId: string;
      eventType: string;
      paymentAttemptId: string;
      amountFcfa: number;
      providerRef: string;
      payload?: Record<string, unknown>;
    };

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data, error } = await supabase.rpc('process_payment_webhook', {
      p_provider_id: body.providerId,
      p_provider_event_id: body.providerEventId,
      p_event_type: body.eventType,
      p_payment_attempt_id: body.paymentAttemptId,
      p_amount_fcfa: body.amountFcfa,
      p_provider_ref: body.providerRef,
      p_payload: body.payload ?? {},
    });

    if (error) throw error;

    return new Response(JSON.stringify({ result: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
