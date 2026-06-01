import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { lovableEventVendre, LOVABLE_ROUTES } from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { Stat } from '@/components/lovable/Stat';
import { VendreWorkflowStrip } from '@/components/lovable/VendreWorkflowStrip';
import { useOrganizerEventParam } from '@/hooks/useOrganizerEvent';
import { vendreService } from '@/services/vendre.service';

export default function VendreAnalyticsPage() {
  const { eventId, event } = useOrganizerEventParam();

  useEffect(() => {
    if (eventId) vendreService.initEvent(eventId);
  }, [eventId]);

  if (!eventId || !event) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;
  if (event.universe !== 'vendre') return <Navigate to={lovableEventVendre(eventId)} replace />;

  const a = vendreService.analytics(eventId);
  const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

  return (
    <div className="pb-4">
      <RoleContextBar location="Analytics VENDRE" />
      <div className="px-6">
        <Link
          to={lovableEventVendre(eventId)}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          VENDRE
        </Link>

        <PageHeader
          eyebrow="Analyser"
          title={
            <>
              Performance
              <br />
              <span className="font-serif italic">billetterie.</span>
            </>
          }
        />

        <VendreWorkflowStrip currentStep={7} compact />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <Stat label="Visites" value={String(a.pageViews)} />
          <Stat label="Ajouts panier" value={String(a.cartAdds)} />
          <Stat label="Achats" value={String(a.purchases)} />
          <Stat label="Conversion" value={`${a.conversionRate}%`} />
          <Stat label="Billets vendus" value={String(a.ticketsSold)} />
          <Stat label="Chiffre d'affaires" value={`${fmt(a.grossRevenueFcfa)} F`} />
          <Stat label="Revenus orga" value={`${fmt(a.organizerRevenueFcfa)} F`} />
          <Stat label="Commission INVORA" value={`${fmt(a.invoraCommissionFcfa)} F`} />
        </div>
      </div>
    </div>
  );
}
