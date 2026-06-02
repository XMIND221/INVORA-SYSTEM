import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import {
  lovableEventAnalytics,
  LOVABLE_ROUTES,
} from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { Stat } from '@/components/lovable/Stat';
import { EventStatusBadge } from '@/components/lovable/EventStatusBadge';
import { OrganizerJourneyStrip } from '@/components/lovable/OrganizerJourneyStrip';
import { EventHubQuickActions } from '@/components/lovable/EventHubQuickActions';
import { FlowStrip } from '@/components/lovable/FlowStrip';
import { UNIVERSE_COPY } from '@/integration/lovable/product-copy';
import { useOrganizerEventParam } from '@/hooks/useOrganizerEvent';
import { archiveExperience, reactivateExperience } from '@/services/events.service';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  LoadingPage,
  NetworkErrorState,
  NotFoundState,
  PermissionDeniedState,
} from '@/components/lovable/ui-states';

export default function EventHubPage() {
  const { eventId, event, isLoading, isError, error, refetch } = useOrganizerEventParam();
  const queryClient = useQueryClient();
  const [actionBusy, setActionBusy] = useState(false);

  if (!eventId) {
    return <NotFoundState description="Identifiant d’événement manquant." />;
  }

  if (isLoading) {
    return (
      <div className="pb-4">
        <RoleContextBar location="Centre de contrôle" />
        <LoadingPage />
      </div>
    );
  }

  if (isError) {
    const msg = error?.message ?? 'Erreur réseau';
    if (msg === 'forbidden') {
      return (
        <div className="pb-4">
          <RoleContextBar location="Centre de contrôle" />
          <PermissionDeniedState description="Vous n’avez pas accès à cet événement." />
        </div>
      );
    }
    return (
      <div className="pb-4">
        <RoleContextBar location="Centre de contrôle" />
        <NetworkErrorState message={msg} onRetry={() => void refetch()} />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="pb-4">
        <RoleContextBar location="Centre de contrôle" />
        <NotFoundState
          title="Événement introuvable"
          description="Cet événement n’existe pas ou n’est plus accessible."
        />
      </div>
    );
  }

  const copy = UNIVERSE_COPY[event.universe];
  const m = event.metrics;
  const accessLabel = event.universe === 'inviter' ? 'Accès' : 'Billets';
  const accessValue =
    event.universe === 'inviter'
      ? `${m.accesses}/${m.accessesMax}`
      : `${m.tickets}/${m.ticketsMax}`;

  const runArchive = async () => {
    setActionBusy(true);
    try {
      await archiveExperience(event.id);
      await queryClient.invalidateQueries({ queryKey: ['organizer-event', eventId] });
      await queryClient.invalidateQueries({ queryKey: ['organizer-events'] });
    } finally {
      setActionBusy(false);
    }
  };

  const runReactivate = async () => {
    setActionBusy(true);
    try {
      await reactivateExperience(event.id);
      await queryClient.invalidateQueries({ queryKey: ['organizer-event', eventId] });
      await queryClient.invalidateQueries({ queryKey: ['organizer-events'] });
    } finally {
      setActionBusy(false);
    }
  };

  return (
    <div className="pb-4">
      <RoleContextBar location="Centre de contrôle" />
      <div className="px-6">
        <Link
          to={LOVABLE_ROUTES.evenements}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          Mes expériences
        </Link>

        <div className="flex items-start justify-between gap-3 mb-2">
          <PageHeader
            eyebrow={`${copy.title} · ${copy.badge}`}
            title={
              <>
                {event.title.split(' ')[0]}
                <br />
                <span className="font-serif italic">
                  {event.title.split(' ').slice(1).join(' ') || event.title}
                </span>
              </>
            }
            description={`${event.dateLabel} · ${event.location}`}
          />
          <EventStatusBadge status={event.status} size="md" />
        </div>

        <OrganizerJourneyStrip currentStep={event.journeyStep} />

        <div className="grid grid-cols-2 gap-2 mb-3">
          <Stat label="Accès / Billets" value={accessValue} />
          <Stat label="Scans" value={String(m.scans)} />
          <Stat label="Conversions" value={`${m.conversions}%`} />
          <Stat
            label="Revenus"
            value={m.revenueEur > 0 ? `${(m.revenueEur / 1000).toFixed(1)}k€` : '—'}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mb-6">
          {accessLabel} · {m.partners} partenaires actifs
        </p>

        <FlowStrip universe={event.universe} currentStep={event.universeFlowStep} compact />

        <p className="eyebrow mt-6 mb-3">Actions rapides</p>
        <EventHubQuickActions eventId={event.id} universe={event.universe} />

        <div className="flex gap-2 mt-4">
          {event.status !== 'archived' ? (
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => void runArchive()}
              className="flex-1 py-3 text-xs border border-border rounded-xl text-muted-foreground"
            >
              Archiver
            </button>
          ) : (
            <button
              type="button"
              disabled={actionBusy}
              onClick={() => void runReactivate()}
              className="flex-1 py-3 text-xs border border-border rounded-xl"
            >
              Réactiver
            </button>
          )}
        </div>

        <Link
          to={lovableEventAnalytics(event.id)}
          className="mt-6 flex items-center justify-between p-4 rounded-xl bg-primary text-primary-foreground"
        >
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] opacity-70">Pilotage</p>
            <p className="font-serif italic text-lg">Analyser l’expérience</p>
          </div>
          <ArrowUpRight className="size-5 shrink-0" />
        </Link>
      </div>
    </div>
  );
}
