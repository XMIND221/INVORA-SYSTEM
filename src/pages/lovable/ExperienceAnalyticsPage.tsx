import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LOVABLE_ROUTES, lovableEventHub } from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { Stat } from '@/components/lovable/Stat';
import { EventStatusBadge } from '@/components/lovable/EventStatusBadge';
import {
  EmptyState,
  LoadingPage,
  NetworkErrorState,
  NotFoundState,
  PermissionDeniedState,
} from '@/components/lovable/ui-states';
import { PRODUCT_VOCABULARY } from '@/integration/lovable/product-vocabulary';
import { useOrganizerEventParam } from '@/hooks/useOrganizerEvent';

export default function ExperienceAnalyticsPage() {
  const { eventId, event, isLoading, isError, error, refetch } = useOrganizerEventParam();

  if (!eventId) {
    return <NotFoundState backTo={LOVABLE_ROUTES.evenements} />;
  }

  if (isLoading) {
    return (
      <div className="pb-4">
        <RoleContextBar location={PRODUCT_VOCABULARY.experience.analytics} />
        <LoadingPage />
      </div>
    );
  }

  if (isError) {
    if (error?.message === 'forbidden') {
      return (
        <div className="pb-4">
          <RoleContextBar location={PRODUCT_VOCABULARY.experience.analytics} />
          <PermissionDeniedState />
        </div>
      );
    }

    return (
      <NetworkErrorState message={error?.message ?? 'Erreur'} onRetry={() => void refetch()} />
    );
  }

  if (!event) {
    return <NotFoundState backTo={LOVABLE_ROUTES.evenements} />;
  }

  const analytics = event.analytics;
  const hasActivity =
    analytics.views > 0 ||
    analytics.invitationsSent > 0 ||
    analytics.ticketsSold > 0 ||
    analytics.scansDone > 0;

  return (
    <div className="pb-4">
      <RoleContextBar location={PRODUCT_VOCABULARY.experience.analytics} />
      <div className="px-6">
        <Link
          to={lovableEventHub(event.id)}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          {PRODUCT_VOCABULARY.experience.hub}
        </Link>

        <div className="flex items-center justify-between gap-2 mb-2">
          <PageHeader
            eyebrow={PRODUCT_VOCABULARY.experience.analytics}
            title={
              <>
                Mesure
                <br />
                <span className="font-serif italic">experience.</span>
              </>
            }
            description={`${event.title} · ${event.dateLabel}`}
          />
          <EventStatusBadge status={event.status} />
        </div>

        {!hasActivity ? (
          <EmptyState
            title="Aucune activite"
            description="Les indicateurs apparaitront lorsque cette experience recevra du trafic, des ventes ou des scans."
            ctaLabel="Retour au centre de controle"
            ctaTo={lovableEventHub(event.id)}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2 mt-4">
            <Stat label="Vues" value={String(analytics.views)} />
            <Stat label="Invitations" value={String(analytics.invitationsSent)} />
            <Stat label="Acceptations" value={String(analytics.invitationsAccepted)} />
            <Stat label="Billets" value={String(analytics.ticketsSold)} />
            <Stat label="Scans" value={String(analytics.scansDone)} />
            <Stat label="Presence" value={`${String(analytics.attendanceRate)}%`} />
          </div>
        )}
      </div>
    </div>
  );
}
