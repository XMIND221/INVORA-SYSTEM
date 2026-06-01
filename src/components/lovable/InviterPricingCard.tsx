import { useEffect, useState } from 'react';
import { formatFcfa, inviterQuoteSummary } from '@/features/engines/finance.engine';
import { FINANCE_ENGINE_COPY } from '@/integration/lovable/product-copy';
import { financeService } from '@/services/finance.service';
import type { InviterPricingQuote } from '@/types/finance';

export function InviterPricingCard({
  quantity,
  existingCount,
}: {
  quantity: number;
  existingCount: number;
}) {
  const [quote, setQuote] = useState<InviterPricingQuote | null>(null);

  useEffect(() => {
    let cancelled = false;
    void financeService.inviterQuote(quantity, existingCount).then((q) => {
      if (!cancelled) setQuote(q);
    });
    return () => {
      cancelled = true;
    };
  }, [quantity, existingCount]);

  if (!quote) {
    return <div className="h-32 rounded-xl bg-surface border border-border animate-pulse" />;
  }

  return (
    <div className="p-4 rounded-xl bg-surface-2 border border-border space-y-3 text-sm">
      <p className="eyebrow">{FINANCE_ENGINE_COPY.inviterTitle}</p>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Prix total</span>
        <span className="font-medium">{formatFcfa(quote.totalFcfa)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Prix unitaire (palier)</span>
        <span>{formatFcfa(quote.unitPriceFcfa)}</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-muted-foreground">Palier actuel</span>
        <span className="font-mono text-xs">{quote.tierLabel}</span>
      </div>
      {quote.averageUnitFcfa != null && quote.quantity > 1 && (
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Moyenne / accès</span>
          <span>{formatFcfa(quote.averageUnitFcfa)}</span>
        </div>
      )}
      {quote.nextTierHint && (
        <p className="text-xs text-primary border-t border-border pt-3">{quote.nextTierHint}</p>
      )}
      <p className="text-[9px] font-mono text-muted-foreground tracking-widest">
        {inviterQuoteSummary(quote)} · {quote.currency} · serveur
      </p>
    </div>
  );
}
