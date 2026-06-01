import { VENDRE_FLOW } from '@/integration/lovable/product-copy';

export function VendreWorkflowStrip({
  currentStep = 0,
  compact,
}: {
  currentStep?: number;
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'mb-4' : 'mb-6'}>
      {!compact && <p className="eyebrow mb-2">Workflow VENDRE</p>}
      <ol className="flex gap-1 overflow-x-auto pb-1">
        {VENDRE_FLOW.map((step, i) => {
          const done = i < currentStep;
          const now = i === currentStep;
          return (
            <li key={step.key} className="shrink-0 min-w-[3rem] flex-1 text-center">
              <div
                className={`h-1 rounded-full mb-1 ${
                  done ? 'bg-foreground' : now ? 'bg-foreground/60' : 'bg-border'
                }`}
              />
              <span
                className={`text-[7px] uppercase tracking-[0.08em] block ${
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
