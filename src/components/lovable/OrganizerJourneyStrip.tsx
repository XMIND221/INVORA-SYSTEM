import { ORGANIZER_JOURNEY } from '@/integration/lovable/product-copy';

interface OrganizerJourneyStripProps {
  /** Index 0–4 (Créer → Analyser) */
  currentStep?: number;
  compact?: boolean;
}

export function OrganizerJourneyStrip({ currentStep = 0, compact }: OrganizerJourneyStripProps) {
  return (
    <div className={compact ? 'mb-4' : 'mb-6'}>
      {!compact && (
        <p className="eyebrow mb-2">Parcours organisateur</p>
      )}
      <ol
        className="flex gap-1 overflow-x-auto pb-1"
        aria-label="Créer, Configurer, Publier, Gérer, Analyser"
      >
        {ORGANIZER_JOURNEY.map((step, i) => {
          const done = i < currentStep;
          const now = i === currentStep;
          return (
            <li key={step.key} className="shrink-0 flex-1 min-w-[3.25rem] text-center">
              <div
                className={`h-1 rounded-full mb-1 ${
                  done ? 'bg-foreground' : now ? 'bg-foreground/60' : 'bg-border'
                }`}
              />
              <span
                className={`text-[8px] uppercase tracking-[0.1em] leading-tight block ${
                  now ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
