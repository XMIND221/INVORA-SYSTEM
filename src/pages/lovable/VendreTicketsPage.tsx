import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import {
  lovableEventHub,
  lovableEventVendre,
  LOVABLE_ROUTES,
} from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { VendrePricingQuoteCard } from '@/components/lovable/VendrePricingQuoteCard';
import { TicketingStatusBadge } from '@/components/lovable/TicketingStatusBadge';
import { TICKET_PRESETS } from '@/features/engines/vendre.engine';
import { useOrganizerEventParam } from '@/hooks/useOrganizerEvent';
import { vendreService } from '@/services/vendre.service';

export default function VendreTicketsPage() {
  const { eventId, event } = useOrganizerEventParam();
  const [name, setName] = useState('Standard');
  const [code, setCode] = useState('standard');
  const [price, setPrice] = useState(10000);
  const [qty, setQty] = useState(100);
  const [, tick] = useState(0);

  useEffect(() => {
    if (eventId) vendreService.initEvent(eventId);
  }, [eventId]);

  if (!eventId || !event) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;
  if (event.universe !== 'vendre') return <Navigate to={lovableEventHub(eventId)} replace />;

  const types = vendreService.listTicketTypes(eventId);

  const handleAdd = async () => {
    await vendreService.addTicketType(eventId, {
      code,
      name,
      priceFcfa: price,
      quantity: qty,
    });
    tick((n) => n + 1);
  };

  return (
    <div className="pb-4">
      <RoleContextBar location="Billets" />
      <div className="px-6">
        <Link
          to={lovableEventVendre(eventId)}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          VENDRE
        </Link>

        <PageHeader
          eyebrow="Créer billets"
          title={
            <>
              Catégories
              <br />
              <span className="font-serif italic">tarifaires.</span>
            </>
          }
          description="0 FCFA autorisé · commission via RPC Supabase."
        />

        <div className="p-4 mb-6 rounded-xl bg-surface border border-border space-y-3">
          <p className="eyebrow">Nouveau type</p>
          <div className="flex flex-wrap gap-2">
            {TICKET_PRESETS.map((p) => (
              <button
                key={p.code}
                type="button"
                onClick={() => {
                  setCode(p.code);
                  setName(p.name);
                }}
                className="text-[9px] uppercase tracking-[0.15em] px-2 py-1 border border-border rounded-full"
              >
                {p.name}
              </button>
            ))}
          </div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom"
            className="w-full p-3 bg-background border border-border rounded-lg text-sm"
          />
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(Number(e.target.value) || 0)}
            className="w-full p-3 bg-background border border-border rounded-lg text-sm font-mono"
          />
          <VendrePricingQuoteCard priceFcfa={price} quantity={qty} />
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value) || 1)}
            placeholder="Quantité"
            className="w-full p-3 bg-background border border-border rounded-lg text-sm"
          />
          <button
            type="button"
            onClick={() => void handleAdd()}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <Plus className="size-4" />
            Ajouter le billet
          </button>
        </div>

        <ul className="space-y-3">
          {types.map((t) => (
            <li key={t.id} className="p-4 rounded-xl bg-surface border border-border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground mt-1">
                    {t.priceFcfa.toLocaleString('fr-FR')} FCFA · {t.soldCount}/
                    {t.quantity ?? '∞'}
                  </p>
                </div>
                <TicketingStatusBadge status={t.ticketingStatus} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Commission {t.commissionFcfa} · Net {t.organizerNetFcfa} FCFA
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
