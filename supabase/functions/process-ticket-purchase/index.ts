import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Phase 4 — finalise un achat (paiement simulé → paid, émission billets).
 * Aucun calcul financier ici : délégation aux RPC Supabase.
 */
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
    };

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: txId, error: checkoutError } = await supabase.rpc('create_ticket_checkout', {
      p_event_id: body.eventId,
      p_ticket_type_id: body.ticketTypeId,
      p_quantity: body.quantity,
      p_buyer_name: body.buyerName,
      p_buyer_phone: body.buyerPhone,
      p_buyer_email: body.buyerEmail ?? null,
    });

    if (checkoutError) throw checkoutError;

    const { data: tickets, error: payError } = await supabase.rpc('complete_ticket_payment', {
      p_transaction_id: txId,
    });

    if (payError) throw payError;

    return new Response(JSON.stringify({ transactionId: txId, tickets }), {
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
