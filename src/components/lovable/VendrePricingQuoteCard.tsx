import { useEffect, useState } from 'react';
import { formatFcfa } from '@/features/engines/finance.engine';
import { FINANCE_ENGINE_COPY } from '@/integration/lovable/product-copy';
import { financeService } from '@/services/finance.service';
import type { VendrePricingQuote } from '@/types/finance';

export function VendrePricingQuoteCard({
  priceFcfa,
  quantity = 1,
}: {
  priceFcfa: number;
  quantity?: number;
}) {
  const [quote, setQuote] = useState<VendrePricingQuote | null>(null);

  useEffect(() => {
    let cancelled = false;
    void financeService.vendreQuote(priceFcfa, quantity).then((q) => {
      if (!cancelled) setQuote(q);
    });
    return () => {
      cancelled = true;
    };
  }, [priceFcfa, quantity]);

  if (!quote) {
    return <div className="h-28 rounded-xl bg-surface border border-border animate-pulse" />;
  }

  return (
    <div className="p-4 rounded-xl bg-surface-2 border border-border space-y-2 text-sm">
      <p className="eyebrow">{FINANCE_ENGINE_COPY.vendreTitle}</p>
      <Row label="Prix billet" value={formatFcfa(quote.priceFcfa)} />
      <Row label="Commission INVORA" value={formatFcfa(quote.commissionFcfa)} />
      <Row label="Net organisateur" value={formatFcfa(quote.organizerNetFcfa)} highlight />
      <Row label="Montant client" value={formatFcfa(quote.clientTotalFcfa)} />
      <p className="text-[9px] font-mono text-muted-foreground tracking-widest pt-1">
        Calcul serveur · {quote.currency}
      </p>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? 'font-medium' : ''}>{value}</span>
    </div>
  );
}
