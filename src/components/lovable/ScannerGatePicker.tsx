import { SCANNER_GATES, gateLabel } from '@/features/engines/scanner.engine';
import type { ScannerGateCode } from '@/types/scanner';

export function ScannerGatePicker({
  value,
  onChange,
}: {
  value: ScannerGateCode;
  onChange: (code: ScannerGateCode) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {SCANNER_GATES.map((g) => (
        <button
          key={g.code}
          type="button"
          onClick={() => onChange(g.code)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.16em] border transition ${
            value === g.code
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-surface border-border text-muted-foreground'
          }`}
        >
          {gateLabel(g.code)}
        </button>
      ))}
    </div>
  );
}
