import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { lovableEventHub, LOVABLE_ROUTES } from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { DesignEnginePreview } from '@/components/lovable/DesignEnginePreview';
import { useOrganizerEventParam } from '@/hooks/useOrganizerEvent';

export default function EventMediasPage() {
  const { eventId, event } = useOrganizerEventParam();

  if (!eventId) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;
  if (!event) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;

  return (
    <div className="pb-4">
      <RoleContextBar location="Médias" />
      <div className="px-6">
        <Link
          to={lovableEventHub(event.id)}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          {event.title}
        </Link>

        <PageHeader
          eyebrow="Médias générés"
          title={
            <>
              Vos supports
              <br />
              <span className="font-serif italic">prêts à l’emploi.</span>
            </>
          }
          description="Pas de galerie — INVORA construit les visuels depuis votre événement."
        />

        <DesignEnginePreview
          universe={event.universe}
          eventTitle={event.title}
          eventId={event.id}
          description={event.description}
          dateLabel={event.dateLabel}
          location={event.location}
          showToneControls
        />
      </div>
    </div>
  );
}
