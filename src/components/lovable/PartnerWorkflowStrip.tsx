import { PARTNER_WORKFLOW } from '@/features/engines/partner.engine';

export function PartnerWorkflowStrip({ currentStep = 0 }: { currentStep?: number }) {
  return (
    <div className="mb-6">
      <p className="eyebrow mb-2">Parcours partenaire</p>
      <ol className="flex gap-1 overflow-x-auto pb-1">
        {PARTNER_WORKFLOW.map((step, i) => {
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
                className={`text-[7px] uppercase tracking-[0.08em] ${
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
