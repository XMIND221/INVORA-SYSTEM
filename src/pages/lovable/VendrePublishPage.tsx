import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  lovableEventVendre,
  lovablePublicTicketing,
  LOVABLE_ROUTES,
} from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { TicketingStatusBadge } from '@/components/lovable/TicketingStatusBadge';
import { useOrganizerEventParam } from '@/hooks/useOrganizerEvent';
import { vendreService } from '@/services/vendre.service';

export default function VendrePublishPage() {
  const { eventId, event } = useOrganizerEventParam();

  useEffect(() => {
    if (eventId) vendreService.initEvent(eventId);
  }, [eventId]);

  if (!eventId || !event) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;
  if (event.universe !== 'vendre') return <Navigate to={lovableEventVendre(eventId)} replace />;

  const status = vendreService.getTicketingStatus(eventId);
  const types = vendreService.listTicketTypes(eventId);

  return (
    <div className="pb-4">
      <RoleContextBar location="Publication" />
      <div className="px-6">
        <Link
          to={lovableEventVendre(eventId)}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          VENDRE
        </Link>

        <PageHeader
          eyebrow="Publier"
          title={
            <>
              Mettre en
              <br />
              <span className="font-serif italic">vente.</span>
            </>
          }
          description="La page publique affiche couverture, billets, prix et CTA achat."
        />

        <div className="flex items-center gap-2 mb-6">
          <span className="eyebrow">Statut</span>
          <TicketingStatusBadge status={status} />
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {types.length} type(s) de billet configuré(s). Paiement simulé en Phase 4 (Stripe hors scope).
        </p>

        <button
          type="button"
          onClick={() => {
            vendreService.publishTicketing(eventId);
            vendreService.startSale(eventId);
          }}
          className="w-full py-4 mb-3 bg-primary text-primary-foreground rounded-2xl text-sm font-medium"
        >
          Publier et ouvrir la vente
        </button>

        <Link
          to={lovablePublicTicketing(eventId)}
          className="block text-center py-3 border border-border rounded-xl text-sm text-muted-foreground"
        >
          Prévisualiser la billetterie publique
        </Link>
      </div>
    </div>
  );
}
