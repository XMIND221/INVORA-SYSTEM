import { Stat } from '@/components/lovable/Stat';
import type { BalanceSummary } from '@/types/finance';

export function FinanceBalanceCard({ balance }: { balance: BalanceSummary }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <Stat label="Disponible" value={balance.availableFcfa.toLocaleString('fr-FR')} />
      <Stat label="En attente" value={balance.pendingFcfa.toLocaleString('fr-FR')} />
      <Stat label="Retiré" value={balance.withdrawnFcfa.toLocaleString('fr-FR')} />
    </div>
  );
}
