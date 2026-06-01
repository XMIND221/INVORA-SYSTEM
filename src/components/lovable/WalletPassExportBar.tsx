import { Apple, Wallet, Share2 } from 'lucide-react';
import { WALLET_ENGINE_COPY } from '@/integration/lovable/product-copy';

export function WalletPassExportBar() {
  return (
    <div className="grid grid-cols-3 gap-2">
      <PassBtn icon={<Apple className="size-4" />} label="Apple Wallet" hint={WALLET_ENGINE_COPY.passApple} />
      <PassBtn icon={<Wallet className="size-4" />} label="Google Wallet" hint={WALLET_ENGINE_COPY.passGoogle} />
      <PassBtn icon={<Share2 className="size-4" />} label="Télécharger" hint={WALLET_ENGINE_COPY.passDownload} />
    </div>
  );
}

function PassBtn({
  icon,
  label,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      title={hint}
      className="flex flex-col items-center gap-1.5 py-3 bg-surface border border-border rounded-xl"
    >
      <span className="text-foreground">{icon}</span>
      <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
    </button>
  );
}
