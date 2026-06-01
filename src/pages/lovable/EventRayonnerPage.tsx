import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { lovableEventHub, LOVABLE_ROUTES } from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { OrganizerJourneyStrip } from '@/components/lovable/OrganizerJourneyStrip';
import { RAYONNER_PHASES } from '@/integration/lovable/product-copy';
import { useOrganizerEventParam } from '@/hooks/useOrganizerEvent';

export default function EventRayonnerPage() {
  const { eventId, event } = useOrganizerEventParam();

  if (!eventId) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;
  if (!event) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;

  return (
    <div className="pb-4">
      <RoleContextBar location="RAYONNER" />
      <div className="px-6">
        <Link
          to={lovableEventHub(event.id)}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          {event.title}
        </Link>

        <PageHeader
          eyebrow="Pilier transverse"
          title={
            <>
              Rayonner
              <br />
              <span className="font-serif italic">autour de l’événement.</span>
            </>
          }
          description="Avant, pendant et après — espace préparé pour la suite produit."
        />

        <OrganizerJourneyStrip currentStep={3} compact />

        <div className="space-y-3 mt-6">
          {RAYONNER_PHASES.map((phase) => (
            <article
              key={phase.key}
              className="p-5 rounded-2xl bg-surface border border-border"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-serif italic text-xl">{phase.label}</p>
                <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground px-2 py-0.5 border border-border rounded-full">
                  <Clock className="size-3" />
                  Bientôt
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{phase.description}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
