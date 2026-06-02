export type DispatchItem = {
  queueId: string;
  channel: string;
  recipientEmail?: string | null;
  recipientPhone?: string | null;
  subject?: string | null;
  body: string;
};

export type SendResult =
  | { ok: true; provider: string; messageId: string }
  | { ok: false; provider: string; error: string };

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) return digits.slice(2);
  return digits;
}

/** Resend — https://resend.com/docs/api-reference/emails/send-email */
export async function sendViaResend(
  item: DispatchItem,
  apiKey: string,
  fromEmail: string,
): Promise<SendResult> {
  const to = item.recipientEmail?.trim();
  if (!to) {
    return { ok: false, provider: 'resend', error: 'missing_recipient_email' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject: item.subject?.trim() || 'INVORA',
      text: item.body,
    }),
  });

  const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) {
    return { ok: false, provider: 'resend', error: json.message ?? `resend_http_${res.status}` };
  }
  return { ok: true, provider: 'resend', messageId: json.id ?? `resend-${item.queueId}` };
}

/** WhatsApp Cloud API — https://developers.facebook.com/docs/whatsapp/cloud-api */
export async function sendViaWhatsApp(
  item: DispatchItem,
  token: string,
  phoneNumberId: string,
): Promise<SendResult> {
  const to = item.recipientPhone ? normalizePhone(item.recipientPhone) : '';
  if (!to) {
    return { ok: false, provider: 'whatsapp', error: 'missing_recipient_phone' };
  }

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: item.body.slice(0, 4096) },
      }),
    },
  );

  const json = (await res.json().catch(() => ({}))) as {
    messages?: { id: string }[];
    error?: { message?: string };
  };
  if (!res.ok) {
    return {
      ok: false,
      provider: 'whatsapp',
      error: json.error?.message ?? `whatsapp_http_${res.status}`,
    };
  }
  const messageId = json.messages?.[0]?.id ?? `wa-${item.queueId}`;
  return { ok: true, provider: 'whatsapp', messageId };
}

/** Simulation traçable (dev / absence de clés API) */
export function sendViaSimulator(item: DispatchItem): SendResult {
  if (item.channel === 'email' && !item.recipientEmail) {
    return { ok: false, provider: 'invora_sim', error: 'missing_recipient_email' };
  }
  if (item.channel === 'whatsapp' && !item.recipientPhone) {
    return { ok: false, provider: 'invora_sim', error: 'missing_recipient_phone' };
  }
  return { ok: true, provider: 'invora_sim', messageId: `sim-${item.queueId}` };
}

export async function dispatchItem(item: DispatchItem): Promise<SendResult> {
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const resendFrom = Deno.env.get('RESEND_FROM_EMAIL') ?? 'INVORA <notifications@invora.app>';
  const waToken = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const waPhoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

  if (item.channel === 'email' && resendKey) {
    return sendViaResend(item, resendKey, resendFrom);
  }
  if (item.channel === 'whatsapp' && waToken && waPhoneId) {
    return sendViaWhatsApp(item, waToken, waPhoneId);
  }

  return sendViaSimulator(item);
}
