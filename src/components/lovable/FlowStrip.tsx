import type { EventUniverse } from '@/types/event';
import { INVITER_FLOW, UNIVERSE_COPY, VENDRE_FLOW } from '@/integration/lovable/product-copy';

interface FlowStripProps {
  universe: EventUniverse;
  /** Index de l'étape courante (0-based) */
  currentStep?: number;
  compact?: boolean;
}

export function FlowStrip({ universe, currentStep = 0, compact }: FlowStripProps) {
  const steps = universe === 'inviter' ? INVITER_FLOW : VENDRE_FLOW;
  const copy = UNIVERSE_COPY[universe];

  return (
    <div className={compact ? 'mb-4' : 'mb-6'}>
      <div className="flex items-center justify-between mb-2">
        <span className="eyebrow">{copy.title}</span>
        <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 border border-border rounded-full text-muted-foreground">
          {copy.badge}
        </span>
      </div>
      {!compact && (
        <p className="text-xs text-muted-foreground mb-3 max-w-sm">{copy.subtitle}</p>
      )}
      <ol
        className={`flex gap-2 overflow-x-auto pb-1 ${universe === 'inviter' ? '' : 'min-w-0'}`}
        aria-label={`Parcours ${copy.title}`}
      >
        {steps.map((step, i) => {
          const done = i < currentStep;
          const now = i === currentStep;
          return (
            <li key={step.key} className="text-center shrink-0 min-w-[3.5rem]">
              <div
                className={`h-1 rounded-full mb-1.5 w-full ${
                  done ? 'bg-foreground' : now ? 'bg-foreground/60' : 'bg-border'
                }`}
              />
              <span
                className={`text-[8px] uppercase tracking-[0.12em] leading-tight block ${
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
