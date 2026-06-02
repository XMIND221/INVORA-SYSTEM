import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { lovableCheckout, lovablePublicTicketing } from '@/lib/constants';
import { usePublicEventMeta } from '@/hooks/usePublicEventMeta';
import { useEventTicketTypes } from '@/hooks/useEventTicketTypes';
import { LoadingPage, NotFoundState } from '@/components/lovable/ui-states';
import { vendreService } from '@/services/vendre.service';
import { initiateVendreCheckout } from '@/services/payment.service';
import { validateCheckoutInput } from '@/features/engines/vendre.engine';
import { PricingBreakdownCard } from '@/components/lovable/PricingBreakdownCard';
import type { PricingBreakdown, VendreTicketType } from '@/types/vendre';

export default function TicketPurchasePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { data: event, isLoading: eventLoading } = usePublicEventMeta(eventId);
  const { data: catalog, isLoading: typesLoading } = useEventTicketTypes(eventId);

  const [type, setType] = useState<VendreTicketType | null>(null);
  const [qty, setQty] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);
  const [paying, setPaying] = useState(false);
  const [providerId] = useState('wave');

  useEffect(() => {
    const typeId = params.get('type');
    const types = catalog?.types ?? [];
    const selected = types.find((t) => t.id === typeId) ?? types[0] ?? null;
    setType(selected);
  }, [catalog, params]);

  useEffect(() => {
    if (!type) return;
    void vendreService.fetchPricing(type.priceFcfa).then(setPricing);
  }, [type]);

  if (eventLoading || typesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingPage />
      </div>
    );
  }

  if (!eventId || !event) {
    return (
      <div className="min-h-screen bg-background">
        <NotFoundState title="Événement introuvable" />
      </div>
    );
  }

  const handlePay = async () => {
    if (!type) return;
    const input = {
      ticketTypeId: type.id,
      quantity: qty,
      firstName,
      lastName,
      phone,
      email: email || undefined,
    };
    const check = validateCheckoutInput(input);
    if (!check.valid) return;

    setPaying(true);
    const buyerName = `${firstName} ${lastName}`.trim();
    const initiated = await initiateVendreCheckout({
      eventId,
      ticketTypeId: type.id,
      quantity: qty,
      buyerName,
      buyerPhone: phone,
      buyerEmail: email || undefined,
      providerId,
    });
    setPaying(false);

    if ('error' in initiated) return;

    const back = lovablePublicTicketing(eventId);
    const qs = new URLSearchParams({
      universe: 'vendre',
      amount: String(initiated.amountFcfa),
      tx: initiated.transactionId,
      eventId,
      type: type.id,
      qty: String(qty),
      name: buyerName,
      phone,
      back,
    });
    if (email) qs.set('email', email);
    navigate(`${lovableCheckout(initiated.paymentAttemptId)}?${qs.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="px-6 pt-8">
        <Link
          to={lovablePublicTicketing(eventId)}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-6"
        >
          <ArrowLeft className="size-3" />
          Retour
        </Link>

        <h1 className="font-serif italic text-2xl">Finaliser l&apos;achat</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {type?.name ?? '—'} · {event.title}
        </p>

        <div className="mt-6 space-y-3">
          <input
            type="number"
            min={1}
            max={10}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value) || 1)}
            className="w-full p-3 border border-border rounded-lg bg-surface"
            placeholder="Quantité"
          />
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Prénom"
            className="w-full p-3 border border-border rounded-lg bg-surface"
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Nom"
            className="w-full p-3 border border-border rounded-lg bg-surface"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Téléphone"
            className="w-full p-3 border border-border rounded-lg bg-surface"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (optionnel)"
            className="w-full p-3 border border-border rounded-lg bg-surface"
          />
        </div>

        {pricing && (
          <div className="mt-4">
            <PricingBreakdownCard pricing={pricing} />
            <p className="text-[10px] text-muted-foreground mt-2">
              Total indicatif : {(pricing.priceFcfa * qty).toLocaleString('fr-FR')} FCFA (confirmé
              serveur au paiement)
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-4">
          Paiement validé par le fournisseur → émission billet → wallet.
        </p>

        <button
          type="button"
          onClick={() => void handlePay()}
          disabled={paying || !type}
          className="mt-6 w-full py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-medium disabled:opacity-60 inline-flex items-center justify-center gap-2"
        >
          {paying ? <Loader2 className="size-4 animate-spin" /> : null}
          Continuer vers le paiement sécurisé
        </button>
      </div>
    </div>
  );
}
