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
import { useEventTicketTypes } from '@/hooks/useEventTicketTypes';
import { vendreService } from '@/services/vendre.service';
import { useQueryClient } from '@tanstack/react-query';

export default function VendrePublishPage() {
  const { eventId, event } = useOrganizerEventParam();
  const { data: catalog } = useEventTicketTypes(eventId);
  const qc = useQueryClient();

  if (!eventId || !event) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;
  if (event.universe !== 'vendre') return <Navigate to={lovableEventVendre(eventId)} replace />;

  const status = catalog?.status ?? 'draft';
  const types = catalog?.types ?? [];

  const publish = async () => {
    await vendreService.publishTicketing(eventId);
    void qc.invalidateQueries({ queryKey: ['ticket-types', eventId] });
  };

  const startSale = async () => {
    await vendreService.startSale(eventId);
    void qc.invalidateQueries({ queryKey: ['ticket-types', eventId] });
  };

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
              Billetterie publique,
              <br />
              <span className="font-serif italic">prête.</span>
            </>
          }
        />
        <TicketingStatusBadge status={status} />
        <p className="text-sm text-muted-foreground mt-4">
          {types.length} type(s) de billet configuré(s).
        </p>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() => void publish()}
            className="w-full py-3 border border-border rounded-xl text-sm"
          >
            Publier la page
          </button>
          <button
            type="button"
            onClick={() => void startSale()}
            className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm"
          >
            Ouvrir les ventes
          </button>
          <Link
            to={lovablePublicTicketing(eventId)}
            className="block text-center py-3 text-[10px] uppercase tracking-[0.2em] text-primary"
          >
            Voir la billetterie publique
          </Link>
        </div>
      </div>
    </div>
  );
}
