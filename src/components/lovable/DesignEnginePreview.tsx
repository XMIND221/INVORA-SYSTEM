import { useEffect } from 'react';
import { DesignLuxuryPreview } from '@/components/lovable/DesignLuxuryPreview';
import { DesignToneControls } from '@/components/lovable/DesignToneControls';
import { designService, buildDesignInputFromEvent } from '@/services/design.service';
import { useDesignStore } from '@/store/design.store';
import type { EventUniverse } from '@/types/event';
import type { DesignToneAxis } from '@/types/design';

interface DesignEnginePreviewProps {
  universe: EventUniverse;
  eventTitle: string;
  eventId?: string;
  description?: string;
  dateLabel?: string;
  location?: string;
  showToneControls?: boolean;
}

export function DesignEnginePreview({
  universe,
  eventTitle,
  eventId = 'draft-preview',
  description = '',
  dateLabel = '',
  location = '',
  showToneControls = false,
}: DesignEnginePreviewProps) {
  const input = buildDesignInputFromEvent({
    id: eventId,
    title: eventTitle,
    description,
    dateLabel,
    location,
    universe,
  });

  const pkg = useDesignStore((s) => s.packagesByEvent[eventId]);

  useEffect(() => {
    designService.generate(input);
  }, [
    eventId,
    eventTitle,
    description,
    dateLabel,
    location,
    universe,
  ]);

  if (!pkg) {
    return <div className="min-h-[200px] rounded-xl bg-surface border border-border animate-pulse" />;
  }

  const handleTone = (axis: DesignToneAxis, delta: number) => {
    designService.adjustTone(eventId, axis, delta);
  };

  return (
    <div>
      {showToneControls && <DesignToneControls onAdjust={handleTone} />}
      <DesignLuxuryPreview
        pkg={pkg}
        eventTitle={eventTitle}
        onToneAdjust={showToneControls ? handleTone : undefined}
      />
    </div>
  );
}
