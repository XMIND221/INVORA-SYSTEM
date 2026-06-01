import { Link, Navigate } from 'react-router-dom';
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

export default function EventHubPage() {
  const { eventId, event } = useOrganizerEventParam();

  if (!eventId) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;
  if (!event) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;

  const copy = UNIVERSE_COPY[event.universe];
  const m = event.metrics;
  const accessLabel = event.universe === 'inviter' ? 'Accès' : 'Billets';
  const accessValue =
    event.universe === 'inviter'
      ? `${m.accesses}/${m.accessesMax}`
      : `${m.tickets}/${m.ticketsMax}`;

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
