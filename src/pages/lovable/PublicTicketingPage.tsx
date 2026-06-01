import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { lovableTicketPurchase } from '@/lib/constants';
import { getOrganizerEvent } from '@/integration/lovable/organizer-mock';
import { vendreService } from '@/services/vendre.service';
import { isTicketTypePurchasable } from '@/features/engines/vendre.engine';
import { TicketingStatusBadge } from '@/components/lovable/TicketingStatusBadge';

export default function PublicTicketingPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const event = eventId ? getOrganizerEvent(eventId) : undefined;

  useEffect(() => {
    if (eventId) {
      vendreService.initEvent(eventId);
      vendreService.recordPageView(eventId);
    }
  }, [eventId]);

  if (!event || event.universe !== 'vendre') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <p className="text-muted-foreground">Billetterie introuvable.</p>
      </div>
    );
  }

  const status = vendreService.getTicketingStatus(eventId!);
  const types = vendreService.listTicketTypes(eventId!);

  return (
    <div className="min-h-screen bg-background pb-12">
      <div
        className="h-48 bg-surface border-b border-border"
        style={{
          background: 'linear-gradient(180deg, oklch(0.2 0 0), oklch(0.07 0 0))',
        }}
      />
      <div className="px-6 -mt-8">
        <p className="eyebrow">INVORA · Billetterie</p>
        <h1 className="font-serif italic text-4xl mt-2">{event.title}</h1>
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground mt-2 uppercase">
          {event.dateLabel} · {event.location}
        </p>
        <div className="mt-3">
          <TicketingStatusBadge status={status} />
        </div>
        <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{event.description}</p>

        <p className="eyebrow mt-8 mb-3">Billets disponibles</p>
        <ul className="space-y-3">
          {types.map((t) => {
            const ok = isTicketTypePurchasable(t, status);
            return (
              <li key={t.id} className="p-4 rounded-2xl bg-surface border border-border">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                  </div>
                  <p className="font-mono text-sm">
                    {t.priceFcfa === 0 ? 'Gratuit' : `${t.priceFcfa.toLocaleString('fr-FR')} FCFA`}
                  </p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  {t.quantity === null
                    ? 'Stock illimité'
                    : `${t.quantity - t.soldCount} places restantes`}
                </p>
                {ok && (
                  <Link
                    to={`${lovableTicketPurchase(eventId!)}?type=${t.id}`}
                    onClick={() => vendreService.recordCartAdd(eventId!)}
                    className="mt-4 w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                  >
                    Acheter
                    <ArrowUpRight className="size-4" />
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
