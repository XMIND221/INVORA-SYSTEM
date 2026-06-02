import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { lovableTicketPurchase } from '@/lib/constants';
import { vendreService } from '@/services/vendre.service';
import { partnerService } from '@/services/partner.service';
import { parseRefFromSearchParams, setStoredPartnerCampaignCode } from '@/lib/partner-attribution';
import { isTicketTypePurchasable } from '@/features/engines/vendre.engine';
import { TicketingStatusBadge } from '@/components/lovable/TicketingStatusBadge';
import { usePublicEventMeta } from '@/hooks/usePublicEventMeta';
import { useEventTicketTypes } from '@/hooks/useEventTicketTypes';
import { LoadingPage, NetworkErrorState, NotFoundState } from '@/components/lovable/ui-states';

export default function PublicTicketingPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();
  const { data: event, isLoading, isError } = usePublicEventMeta(eventId);
  const {
    data: catalog,
    isLoading: typesLoading,
    isError: typesError,
    refetch,
  } = useEventTicketTypes(eventId);

  useEffect(() => {
    if (eventId) void vendreService.recordPageView(eventId);
  }, [eventId]);

  useEffect(() => {
    const ref = parseRefFromSearchParams(searchParams);
    if (!ref || !eventId) return;
    void partnerService.recordClick(ref, eventId).then((r) => {
      setStoredPartnerCampaignCode(r.campaignCode);
      void partnerService.recordOpen(r.campaignCode);
    });
  }, [eventId, searchParams]);

  if (isLoading || typesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingPage />
      </div>
    );
  }

  if (isError || typesError) {
    return (
      <div className="min-h-screen bg-background px-6 flex items-center">
        <NetworkErrorState
          message="Impossible de charger la billetterie."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!event || event.universe !== 'vendre') {
    return (
      <div className="min-h-screen bg-background">
        <NotFoundState title="Billetterie introuvable" backTo="/" backLabel="Accueil" />
      </div>
    );
  }

  const status = catalog?.status ?? 'draft';
  const types = catalog?.types ?? [];

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
        {types.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 border border-dashed border-border rounded-2xl">
            Aucun type de billet publié pour cet événement.
          </p>
        ) : (
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
                      : `${Math.max(0, t.quantity - t.soldCount)} places restantes`}
                  </p>
                  {ok && eventId && (
                    <Link
                      to={`${lovableTicketPurchase(eventId)}?type=${t.id}`}
                      onClick={() => void vendreService.recordCartAdd(eventId)}
                      className="mt-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-primary"
                    >
                      Acheter
                      <ArrowUpRight className="size-3" />
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
