import { Lock, ShieldCheck } from 'lucide-react';

export function CheckoutTrustBar() {
  return (
    <div className="flex items-center justify-center gap-6 py-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <Lock className="size-3" strokeWidth={1.5} />
        Paiement sécurisé
      </span>
      <span className="inline-flex items-center gap-1.5">
        <ShieldCheck className="size-3" strokeWidth={1.5} />
        Validation serveur
      </span>
    </div>
  );
}
