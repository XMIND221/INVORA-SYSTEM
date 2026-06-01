import type { PricingBreakdown } from '@/types/vendre';

/** Affiche uniquement des montants renvoyés par le serveur (RPC). */
export function PricingBreakdownCard({ pricing }: { pricing: PricingBreakdown }) {
  const fmt = (n: number) =>
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-4 rounded-xl bg-surface-2 border border-border space-y-2 text-sm">
      <Row label="Prix billet" value={`${fmt(pricing.priceFcfa)} FCFA`} />
      <Row label="Commission INVORA" value={`${fmt(pricing.commissionFcfa)} FCFA`} />
      <Row label="Net organisateur" value={`${fmt(pricing.organizerNetFcfa)} FCFA`} highlight />
      <p className="text-[9px] text-muted-foreground font-mono tracking-widest pt-1">
        Calcul serveur · {pricing.currency}
      </p>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? 'font-medium text-foreground' : ''}>{value}</span>
    </div>
  );
}
