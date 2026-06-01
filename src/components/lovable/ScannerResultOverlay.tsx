import { Check, X } from 'lucide-react';
import { denialReasonLabel, guestDisplayName } from '@/features/engines/scanner.engine';
import type { ScannerValidationDisplay } from '@/types/scanner';

export function ScannerResultOverlay({ display }: { display: ScannerValidationDisplay | null }) {
  if (!display) return null;
  const ok = display.status === 'validated';

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center backdrop-blur-md ${
        ok ? 'bg-[color-mix(in_oklab,var(--color-success)_25%,black)]' : 'bg-[color-mix(in_oklab,var(--color-destructive)_30%,black)]'
      }`}
    >
      {ok ? (
        <Check className="size-12 text-[color:var(--color-success)] mb-3" strokeWidth={2.5} />
      ) : (
        <X className="size-12 text-destructive mb-3" strokeWidth={2.5} />
      )}
      <p className="text-white font-serif italic text-3xl mb-2">{ok ? 'Validé' : 'Refusé'}</p>
      <p className="text-white/90 text-lg font-medium">
        {guestDisplayName(display.firstName, display.lastName)}
      </p>
      <p className="text-white/70 text-sm mt-1">{display.accessTypeLabel}</p>
      <p className="text-white/50 text-xs mt-2">{display.eventTitle}</p>
      {!ok && display.denialReason && (
        <p className="text-destructive-foreground/90 text-sm mt-4 font-medium">
          {denialReasonLabel(display.denialReason)}
        </p>
      )}
    </div>
  );
}
