import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FinanceBalanceCard } from '@/components/lovable/FinanceBalanceCard';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { formatFcfa, ledgerRowLabel, PAYOUT_STATUS_LABEL } from '@/features/engines/finance.engine';
import { FINANCE_ENGINE_COPY } from '@/integration/lovable/product-copy';
import { lovableFinanceReports, LOVABLE_ROUTES } from '@/lib/constants';
import { financeService } from '@/services/finance.service';
import type { BalanceSummary } from '@/types/finance';

export default function OrganizerFinancePage() {
  const [balance, setBalance] = useState<BalanceSummary | null>(null);
  const ledger = financeService.organizerLedger();
  const payouts = financeService.organizerPayouts();

  useEffect(() => {
    void financeService.organizerBalance().then(setBalance);
  }, []);

  return (
    <div className="pb-4">
      <RoleContextBar location="Finance" />
      <div className="px-6">
        <PageHeader
          eyebrow="Organisateur"
          title={
            <>
              Solde &
              <br />
              <span className="font-serif italic">retraits.</span>
            </>
          }
          description={FINANCE_ENGINE_COPY.organizerDesc}
        />
        {balance && <FinanceBalanceCard balance={balance} />}

        <Link
          to={lovableFinanceReports()}
          className="block mt-6 mb-6 text-center py-3 border border-border rounded-xl text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          Rapports & export CSV
        </Link>

        <p className="eyebrow mb-3">Historique opérations</p>
        <ul className="space-y-2 mb-8">
          {ledger.map((row, i) => (
            <li key={i} className="p-4 rounded-xl bg-surface border border-border text-sm">
              <div className="flex justify-between gap-2">
                <span className="font-medium">{ledgerRowLabel(row)}</span>
                <time className="font-mono text-[10px] text-muted-foreground">
                  {new Date(row.at).toLocaleDateString('fr-FR')}
                </time>
              </div>
              {row.organizerNetFcfa != null && (
                <p className="text-xs text-muted-foreground mt-1">
                  Net {formatFcfa(row.organizerNetFcfa)} · INVORA{' '}
                  {row.invoraCommissionFcfa != null ? formatFcfa(row.invoraCommissionFcfa) : '—'}
                </p>
              )}
            </li>
          ))}
        </ul>

        <p className="eyebrow mb-3">Demandes de retrait</p>
        <ul className="space-y-2">
          {payouts.map((p) => (
            <li key={p.id} className="p-4 rounded-xl bg-surface border border-border flex justify-between">
              <span>{formatFcfa(p.amountFcfa)}</span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                {PAYOUT_STATUS_LABEL[p.status]}
              </span>
            </li>
          ))}
        </ul>

        <Link
          to={LOVABLE_ROUTES.accueil}
          className="mt-8 block text-center text-xs text-muted-foreground"
        >
          Retour accueil
        </Link>
      </div>
    </div>
  );
}
