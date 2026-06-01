import { STUDIO_STEPS } from '@/lib/constants';

interface StudioStepperProps {
  current: number;
}

export function StudioStepper({ current }: StudioStepperProps) {
  return (
    <div className="flex gap-1 mb-6" aria-label={`Étape ${current} sur ${STUDIO_STEPS}`}>
      {Array.from({ length: STUDIO_STEPS }, (_, i) => {
        const step = i + 1;
        const active = step === current;
        const done = step < current;
        return (
          <div
            key={step}
            className={`h-1 flex-1 rounded-full transition ${
              done ? 'bg-foreground' : active ? 'bg-foreground/70' : 'bg-border'
            }`}
          />
        );
      })}
    </div>
  );
}
