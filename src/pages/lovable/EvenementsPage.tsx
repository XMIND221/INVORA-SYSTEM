import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { lovableEventHub, LOVABLE_ROUTES } from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { OrganizerJourneyStrip } from '@/components/lovable/OrganizerJourneyStrip';
import { EventStatusBadge } from '@/components/lovable/EventStatusBadge';
import { UNIVERSE_COPY } from '@/integration/lovable/product-copy';
import { useOrganizerEvents } from '@/hooks/useOrganizerEvents';
import { useAuth } from '@/hooks/useAuth';
import {
  EmptyState,
  LoadingCard,
  LoadingPage,
  NetworkErrorState,
  PermissionDeniedState,
} from '@/components/lovable/ui-states';

export default function EvenementsPage() {
  const { profile, isAuthenticated, isLoading: authLoading } = useAuth();
  const { events, isLoading, isError, error, refetch } = useOrganizerEvents();

  if (authLoading || isLoading) {
    return (
      <div className="pb-4">
        <RoleContextBar location="Mes événements" />
        <div className="px-6">
          <LoadingPage label="Chargement de vos expériences…" />
          <div className="space-y-3 mt-4">
            <LoadingCard />
            <LoadingCard />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="pb-4">
        <RoleContextBar location="Mes événements" />
        <PermissionDeniedState />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="pb-4">
        <RoleContextBar location="Mes événements" />
        <NetworkErrorState
          message={error?.message ?? 'Impossible de charger les événements'}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const drafts = events.filter((e) => e.status === 'draft');
  const published = events.filter((e) => e.status !== 'draft' && e.status !== 'archived');
  const archived = events.filter((e) => e.status === 'archived');

  return (
    <div className="pb-4">
      <RoleContextBar location="Mes événements" />
      <div className="px-6">
        <PageHeader
          eyebrow="Catalogue"
          title={
            <>
              Mes
              <br />
              <span className="font-serif italic">expériences.</span>
            </>
          }
          description={
            profile?.full_name
              ? `${profile.full_name} · ${events.length} expérience(s)`
              : 'Statuts unifiés · accès direct au centre de contrôle.'
          }
        />

        <OrganizerJourneyStrip currentStep={3} compact />

        {events.length === 0 ? (
          <EmptyState
            title="Aucune expérience"
            description="Créez votre première expérience INVORA. Elle sera enregistrée dans Supabase."
            ctaLabel="Créer une expérience"
            ctaTo={LOVABLE_ROUTES.creer}
          />
        ) : (
          <div className="space-y-6">
            {drafts.length > 0 ? (
              <EventSection title="Brouillons" items={drafts} />
            ) : null}
            {published.length > 0 ? (
              <EventSection title="Publiés & actifs" items={published} />
            ) : null}
            {archived.length > 0 ? (
              <EventSection title="Archivés" items={archived} />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function EventSection({
  title,
  items,
}: {
  title: string;
  items: ReturnType<typeof useOrganizerEvents>['events'];
}) {
  return (
    <div>
      <p className="eyebrow mb-3">{title}</p>
      <div className="space-y-3">
        {items.map((e) => {
          const copy = UNIVERSE_COPY[e.universe];
          const cap =
            e.universe === 'inviter'
              ? `${e.metrics.accesses} / ${e.metrics.accessesMax}`
              : `${e.metrics.tickets} / ${e.metrics.ticketsMax}`;

          return (
            <Link
              key={e.id}
              to={lovableEventHub(e.id)}
              className="flex items-center gap-4 p-4 bg-surface border border-border rounded-2xl hover:border-border-strong transition"
            >
              <div
                className="size-14 shrink-0 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, oklch(0.18 0 0), oklch(0.1 0 0))',
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-medium truncate">{e.title}</h3>
                  <EventStatusBadge status={e.status} />
                </div>
                <p className="font-mono text-[10px] tracking-widest text-muted-foreground mt-1 uppercase">
                  {e.dateLabel} · {e.location}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 border border-border rounded-full">
                    {copy.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{cap}</span>
                </div>
              </div>
              <ArrowUpRight className="size-4 text-muted-foreground shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
