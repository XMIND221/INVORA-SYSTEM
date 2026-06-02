import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/** Dev / staging — simule confirmation provider via webhook engine */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as {
      paymentAttemptId: string;
      providerId: string;
      amountFcfa: number;
    };

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const providerEventId = `sim_${crypto.randomUUID()}`;
    const providerRef = `ref_${body.paymentAttemptId.slice(0, 8)}`;

    const { data, error } = await supabase.rpc('process_payment_webhook', {
      p_provider_id: body.providerId,
      p_provider_event_id: providerEventId,
      p_event_type: 'payment.succeeded',
      p_payment_attempt_id: body.paymentAttemptId,
      p_amount_fcfa: body.amountFcfa,
      p_provider_ref: providerRef,
      p_payload: { simulated: true },
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
