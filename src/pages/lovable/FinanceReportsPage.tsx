import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { financeReportToCsv } from '@/features/engines/finance.engine';
import { FINANCE_ENGINE_COPY } from '@/integration/lovable/product-copy';
import { lovableFinance, LOVABLE_ROUTES } from '@/lib/constants';
import { financeService } from '@/services/finance.service';
import type { FinanceReport } from '@/types/finance';

export default function FinanceReportsPage() {
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [scope, setScope] = useState<'organizer' | 'partner' | 'invora'>('organizer');

  useEffect(() => {
    void financeService.report(scope).then(setReport);
  }, [scope]);

  function downloadCsv() {
    if (!report) return;
    const csv = financeReportToCsv(report.rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invora-${scope}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="pb-4">
      <RoleContextBar location="Rapports finance" />
      <div className="px-6">
        <Link
          to={lovableFinance()}
          className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4 inline-block"
        >
          Finance
        </Link>
        <PageHeader
          eyebrow="Exports"
          title="Rapports"
          description={FINANCE_ENGINE_COPY.reportsDesc}
        />
        <div className="flex gap-2 mb-6">
          {(['organizer', 'partner', 'invora'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={`px-3 py-1.5 rounded-full text-[9px] uppercase tracking-[0.14em] border ${
                scope === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        {report?.exportReady && (
          <button
            type="button"
            onClick={downloadCsv}
            className="w-full mb-6 py-3 flex items-center justify-center gap-2 border border-border rounded-xl text-sm"
          >
            <Download className="size-4" />
            Télécharger CSV
          </button>
        )}
        <ul className="space-y-2 max-h-[50vh] overflow-y-auto">
          {report?.rows.map((r, i) => (
            <li key={i} className="p-3 rounded-xl bg-surface border border-border text-xs font-mono">
              {r.at} · {r.universe ?? scope} · {r.grossFcfa ?? r.commissionFcfa ?? '—'} FCFA
            </li>
          ))}
        </ul>
        <Link to={LOVABLE_ROUTES.accueil} className="mt-6 block text-center text-xs text-muted-foreground">
          Accueil
        </Link>
      </div>
    </div>
  );
}
