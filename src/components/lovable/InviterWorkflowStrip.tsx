import { INVITER_FLOW } from '@/integration/lovable/product-copy';

interface InviterWorkflowStripProps {
  currentStep?: number;
  compact?: boolean;
}

export function InviterWorkflowStrip({ currentStep = 0, compact }: InviterWorkflowStripProps) {
  return (
    <div className={compact ? 'mb-4' : 'mb-6'}>
      {!compact && <p className="eyebrow mb-2">Workflow INVITER</p>}
      <ol className="flex gap-1 overflow-x-auto pb-1" aria-label="Workflow accès privés">
        {INVITER_FLOW.map((step, i) => {
          const done = i < currentStep;
          const now = i === currentStep;
          return (
            <li key={step.key} className="shrink-0 min-w-[3rem] text-center flex-1">
              <div
                className={`h-1 rounded-full mb-1 ${
                  done ? 'bg-foreground' : now ? 'bg-foreground/60' : 'bg-border'
                }`}
              />
              <span
                className={`text-[7px] uppercase tracking-[0.08em] leading-tight block ${
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
