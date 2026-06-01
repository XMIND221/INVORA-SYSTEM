import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { lovableEventHub, LOVABLE_ROUTES } from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { Stat } from '@/components/lovable/Stat';
import { OrganizerJourneyStrip } from '@/components/lovable/OrganizerJourneyStrip';
import { EventStatusBadge } from '@/components/lovable/EventStatusBadge';
import { useOrganizerEventParam } from '@/hooks/useOrganizerEvent';

export default function EventAnalyticsPage() {
  const { eventId, event } = useOrganizerEventParam();

  if (!eventId) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;
  if (!event) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;

  const a = event.analytics;

  return (
    <div className="pb-4">
      <RoleContextBar location="Analytics" />
      <div className="px-6">
        <Link
          to={lovableEventHub(event.id)}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          {event.title}
        </Link>

        <div className="flex items-center justify-between gap-2 mb-2">
          <PageHeader
            eyebrow="Analyser"
            title={
              <>
                Métriques
                <br />
                <span className="font-serif italic">en direct.</span>
              </>
            }
            description="Vues, invitations, billets, scans et présence."
          />
          <EventStatusBadge status={event.status} />
        </div>

        <OrganizerJourneyStrip currentStep={4} compact />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <Stat label="Vues" value={String(a.views)} />
          <Stat label="Invitations envoyées" value={String(a.invitationsSent)} />
          <Stat label="Invitations acceptées" value={String(a.invitationsAccepted)} />
          <Stat label="Billets vendus" value={String(a.ticketsSold)} />
          <Stat label="Scans réalisés" value={String(a.scansDone)} />
          <Stat label="Taux de présence" value={`${a.attendanceRate}%`} />
          <Stat label="Partenaires actifs" value={String(a.activePartners)} />
        </div>

        <p className="text-xs text-muted-foreground mt-6 p-4 bg-surface border border-border rounded-xl">
          Données démo Phase 2 — branchement `event_metrics` et `analytics_events` à la phase
          métier.
        </p>
      </div>
    </div>
  );
}
