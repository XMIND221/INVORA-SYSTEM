import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { DesignLuxuryPreview } from '@/components/lovable/DesignLuxuryPreview';
import { DesignToneControls } from '@/components/lovable/DesignToneControls';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { LUXURY_DESIGN_COPY } from '@/integration/lovable/product-copy';
import { lovableEventHub, LOVABLE_ROUTES } from '@/lib/constants';
import { buildDesignInputFromEvent, designService } from '@/services/design.service';
import { useOrganizerEventParam } from '@/hooks/useOrganizerEvent';
import type { DesignToneAxis } from '@/types/design';
import { useMemo, useState } from 'react';

export default function DesignStudioPage() {
  const { eventId, event } = useOrganizerEventParam();
  const [, setTick] = useState(0);

  const input = useMemo(() => {
    if (!event) return null;
    return buildDesignInputFromEvent({
      id: event.id,
      title: event.title,
      description: event.description,
      dateLabel: event.dateLabel,
      location: event.location,
      universe: event.universe,
    });
  }, [event]);

  const pkg = useMemo(() => {
    if (!input) return null;
    return designService.generate(input);
  }, [input]);

  if (!eventId) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;
  if (!event || !pkg || !input) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;

  const onTone = (axis: DesignToneAxis, delta: number) => {
    designService.adjustTone(event.id, axis, delta);
    setTick((t) => t + 1);
  };

  return (
    <div className="pb-4">
      <RoleContextBar location="Design Engine" />
      <div className="px-6">
        <Link
          to={lovableEventHub(event.id)}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          {event.title}
        </Link>
        <PageHeader
          eyebrow="Identité visuelle"
          title={
            <>
              INVORA crée
              <br />
              <span className="font-serif italic">votre univers.</span>
            </>
          }
          description={LUXURY_DESIGN_COPY.noGallery}
        />
        <DesignToneControls onAdjust={onTone} />
        <DesignLuxuryPreview
          pkg={designService.getPackage(event.id) ?? pkg}
          eventTitle={event.title}
        />
        <p className="mt-6 text-[10px] text-muted-foreground font-mono truncate">
          Fingerprint · {pkg.identity.fingerprint}
        </p>
      </div>
    </div>
  );
}
