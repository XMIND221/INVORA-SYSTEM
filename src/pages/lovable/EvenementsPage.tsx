import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { lovableEventHub, LOVABLE_ROUTES } from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { OrganizerJourneyStrip } from '@/components/lovable/OrganizerJourneyStrip';
import { EventStatusBadge } from '@/components/lovable/EventStatusBadge';
import { ORGANIZER_MOCK_EVENTS } from '@/integration/lovable/organizer-mock';
import { UNIVERSE_COPY } from '@/integration/lovable/product-copy';

export default function EvenementsPage() {
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
          description="Statuts unifiés · accès direct au centre de contrôle."
        />

        <OrganizerJourneyStrip currentStep={3} compact />

        <div className="space-y-3">
          {ORGANIZER_MOCK_EVENTS.map((e) => {
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
                    <span className="font-mono text-[10px] text-muted-foreground">{cap}</span>
                  </div>
                </div>
                <ArrowUpRight className="size-4 text-muted-foreground shrink-0" />
              </Link>
            );
          })}
        </div>

        <Link
          to={LOVABLE_ROUTES.creer}
          className="mt-6 block text-center py-3 border border-dashed border-border-strong rounded-xl text-sm text-muted-foreground"
        >
          + Créer une expérience
        </Link>
      </div>
    </div>
  );
}
