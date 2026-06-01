import { Sparkles } from 'lucide-react';
import { designMotionClasses, DESIGN_ANIMATION_CSS } from '@/features/engines/design-animations';
import { identityToCssVars } from '@/features/engines/design.engine';
import { LUXURY_DESIGN_COPY } from '@/integration/lovable/product-copy';
import type { DesignPackage } from '@/types/design';

export function DesignLuxuryPreview({
  pkg,
  eventTitle,
  onToneAdjust,
}: {
  pkg: DesignPackage;
  eventTitle: string;
  onToneAdjust?: (axis: import('@/types/design').DesignToneAxis, delta: number) => void;
}) {
  const vars = identityToCssVars(pkg.identity);
  const { identity } = pkg;

  return (
    <div className="invora-design-reveal">
      <style>{DESIGN_ANIMATION_CSS}</style>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="size-4 text-muted-foreground" strokeWidth={1.5} />
        <p className="eyebrow">{LUXURY_DESIGN_COPY.title}</p>
      </div>
      <p className="text-xs text-muted-foreground mb-4 max-w-sm">{LUXURY_DESIGN_COPY.subtitle}</p>

      <article
        className={`mb-5 p-4 rounded-2xl border border-border overflow-hidden ${designMotionClasses.cardHover}`}
        style={{
          background: `linear-gradient(160deg, ${identity.palette.background}, ${identity.palette.surface})`,
          borderColor: identity.palette.accent,
          color: identity.palette.text,
          ...vars,
        }}
      >
        <p className="text-[9px] uppercase tracking-[0.25em] opacity-70 mb-2">
          Identité · {identity.visualProfile.moodLabel}
        </p>
        <p className="font-serif italic text-2xl">{eventTitle}</p>
        <p className="font-mono text-[10px] mt-3 opacity-60 truncate">{identity.signature}</p>
        <p className="text-[9px] mt-2 opacity-50">ADN INVORA · création sur mesure</p>
      </article>

      <div className="grid grid-cols-2 gap-2">
        {pkg.assets.map((asset) => (
          <article
            key={asset.kind}
            className={`p-3 rounded-xl bg-surface border border-border ${designMotionClasses.cardHover}`}
          >
            <div
              className="rounded-lg mb-2 flex items-end p-2 min-h-[72px]"
              style={asset.previewStyle}
            >
              <span className="text-[8px] uppercase tracking-[0.12em] text-white/80 truncate">
                {eventTitle}
              </span>
            </div>
            <p className="text-sm font-medium">{asset.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{asset.format}</p>
            <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground mt-2">
              Généré · cohérent
            </p>
          </article>
        ))}
      </div>

      {onToneAdjust && (
        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          Ajustez le ton ci-dessus — INVORA recalcule sans template.
        </p>
      )}

      <p className="mt-4 text-center font-mono text-[10px] tracking-widest text-muted-foreground">
        {LUXURY_DESIGN_COPY.footer}
      </p>
    </div>
  );
}
