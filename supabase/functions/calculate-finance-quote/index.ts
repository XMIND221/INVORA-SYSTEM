import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as {
      type: 'inviter' | 'vendre';
      quantity?: number;
      existingCount?: number;
      priceFcfa?: number;
    };

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    if (body.type === 'inviter') {
      const { data, error } = await supabase.rpc('calculate_inviter_pricing_quote', {
        p_quantity: body.quantity ?? 1,
        p_existing_count: body.existingCount ?? 0,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ quote: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase.rpc('calculate_vendre_pricing_quote', {
      p_price_fcfa: body.priceFcfa ?? 0,
      p_quantity: body.quantity ?? 1,
    });
    if (error) throw error;

    return new Response(JSON.stringify({ quote: data }), {
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
