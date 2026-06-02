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
      eventId: string;
      ticketTypeId: string;
      quantity: number;
      buyerName: string;
      buyerPhone: string;
      buyerEmail?: string;
      providerId?: string;
    };

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data, error } = await supabase.rpc('initiate_vendre_checkout', {
      p_event_id: body.eventId,
      p_ticket_type_id: body.ticketTypeId,
      p_quantity: body.quantity,
      p_buyer_name: body.buyerName,
      p_buyer_phone: body.buyerPhone,
      p_buyer_email: body.buyerEmail ?? null,
      p_provider_id: body.providerId ?? 'wave',
    });

    if (error) throw error;

    return new Response(JSON.stringify({ checkout: data }), {
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
