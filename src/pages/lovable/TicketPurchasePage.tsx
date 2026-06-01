import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { lovablePublicTicketing, lovableTicketPublic } from '@/lib/constants';
import { getOrganizerEvent } from '@/integration/lovable/organizer-mock';
import { vendreService } from '@/services/vendre.service';
import { validateCheckoutInput } from '@/features/engines/vendre.engine';
import { PricingBreakdownCard } from '@/components/lovable/PricingBreakdownCard';
import type { PricingBreakdown, VendreTicketType } from '@/types/vendre';

export default function TicketPurchasePage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const event = eventId ? getOrganizerEvent(eventId) : undefined;

  const [type, setType] = useState<VendreTicketType | null>(null);
  const [qty, setQty] = useState(1);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);

  useEffect(() => {
    if (!eventId) return;
    vendreService.initEvent(eventId);
    const typeId = params.get('type');
    const types = vendreService.listTicketTypes(eventId);
    const selected = types.find((t) => t.id === typeId) ?? types[0] ?? null;
    setType(selected);
  }, [eventId, params]);

  useEffect(() => {
    if (!type) return;
    void vendreService.fetchPricing(type.priceFcfa).then(setPricing);
  }, [type]);

  if (!eventId || !event) {
    return <div className="min-h-screen bg-background p-6">Événement introuvable.</div>;
  }

  const handlePay = () => {
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

    const result = vendreService.checkout(eventId, input);
    if ('error' in result) return;
    const ticket = result.tickets[0];
    if (ticket) navigate(lovableTicketPublic(ticket.accessToken));
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
          {type?.name} · {event.title}
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
          Paiement simulé Phase 4 — statut passera à <strong>paid</strong> côté serveur avant émission
          QR.
        </p>

        <button
          type="button"
          onClick={handlePay}
          className="mt-6 w-full py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-medium"
        >
          Payer et recevoir mes billets
        </button>
      </div>
    </div>
  );
}
