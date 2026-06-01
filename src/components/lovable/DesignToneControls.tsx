import type { DesignToneAxis } from '@/types/design';
import { LUXURY_DESIGN_COPY } from '@/integration/lovable/product-copy';

const AXES: { key: DesignToneAxis; label: string }[] = [
  { key: 'elegant', label: 'Plus élégant' },
  { key: 'modern', label: 'Plus moderne' },
  { key: 'premium', label: 'Plus premium' },
  { key: 'festive', label: 'Plus festif' },
  { key: 'corporate', label: 'Plus corporate' },
  { key: 'exclusive', label: 'Plus exclusif' },
];

export function DesignToneControls({
  onAdjust,
}: {
  onAdjust: (axis: DesignToneAxis, delta: number) => void;
}) {
  return (
    <div className="space-y-2 mb-6">
      <p className="eyebrow">{LUXURY_DESIGN_COPY.toneTitle}</p>
      <p className="text-[10px] text-muted-foreground mb-3">{LUXURY_DESIGN_COPY.toneHint}</p>
      <div className="flex flex-wrap gap-2">
        {AXES.map((a) => (
          <button
            key={a.key}
            type="button"
            onClick={() => onAdjust(a.key, 0.12)}
            className="px-3 py-2 text-[9px] uppercase tracking-[0.14em] rounded-full border border-border bg-surface hover:border-border-strong transition"
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}
