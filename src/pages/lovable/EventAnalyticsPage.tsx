import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { lovableEventHub, LOVABLE_ROUTES } from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { Stat } from '@/components/lovable/Stat';
import { OrganizerJourneyStrip } from '@/components/lovable/OrganizerJourneyStrip';
import { EventStatusBadge } from '@/components/lovable/EventStatusBadge';
import { useOrganizerEventParam } from '@/hooks/useOrganizerEvent';
import {
  EmptyState,
  LoadingPage,
  NetworkErrorState,
  NotFoundState,
  PermissionDeniedState,
} from '@/components/lovable/ui-states';

export default function EventAnalyticsPage() {
  const { eventId, event, isLoading, isError, error, refetch } = useOrganizerEventParam();

  if (!eventId) return <NotFoundState backTo={LOVABLE_ROUTES.evenements} />;

  if (isLoading) {
    return (
      <div className="pb-4">
        <RoleContextBar location="Analytics" />
        <LoadingPage />
      </div>
    );
  }

  if (isError) {
    if (error?.message === 'forbidden') {
      return (
        <div className="pb-4">
          <PermissionDeniedState />
        </div>
      );
    }
    return <NetworkErrorState message={error?.message ?? 'Erreur'} onRetry={() => void refetch()} />;
  }

  if (!event) {
    return <NotFoundState backTo={LOVABLE_ROUTES.evenements} />;
  }

  const a = event.analytics;
  const hasData = a.views > 0 || a.invitationsSent > 0 || a.ticketsSold > 0;

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
          />
          <EventStatusBadge status={event.status} />
        </div>

        <OrganizerJourneyStrip currentStep={4} compact />

        {!hasData ? (
          <EmptyState
            title="Aucune donnée analytics"
            description="Les métriques apparaîtront lorsque l’expérience recevra du trafic ou des ventes."
            ctaLabel="Retour au hub"
            ctaTo={lovableEventHub(event.id)}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Stat label="Vues" value={String(a.views)} />
            <Stat label="Invitations" value={String(a.invitationsSent)} />
            <Stat label="Acceptées" value={String(a.invitationsAccepted)} />
            <Stat label="Billets" value={String(a.ticketsSold)} />
            <Stat label="Scans" value={String(a.scansDone)} />
            <Stat label="Présence" value={`${a.attendanceRate}%`} />
          </div>
        )}
      </div>
    </div>
  );
}
