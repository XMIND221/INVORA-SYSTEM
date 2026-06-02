import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { Stat } from '@/components/lovable/Stat';
import { gateLabel } from '@/features/engines/scanner.engine';
import { SCANNER_ENGINE_COPY } from '@/integration/lovable/product-copy';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { useScannerAnalytics, useScannerSession } from '@/hooks/useScannerData';
import { LoadingPage } from '@/components/lovable/ui-states';
import type { ScannerGateCode } from '@/types/scanner';

export default function ScannerAnalyticsPage() {
  const { data: session } = useScannerSession();
  const { data: a, isLoading } = useScannerAnalytics(session?.eventId);

  if (isLoading || !a) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingPage />
      </div>
    );
  }

  const gates = Object.entries(a.scansByGate) as [ScannerGateCode, number][];

  return (
    <div className="pb-4">
      <RoleContextBar location="Analytics terrain" />
      <div className="px-6">
        <Link
          to={LOVABLE_ROUTES.scanner}
          className="inline-flex items-center gap-2 text-xs text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3.5" />
          Scanner
        </Link>
        <PageHeader
          eyebrow={session?.eventTitle ?? 'Événement'}
          title="Terrain"
          description={SCANNER_ENGINE_COPY.analyticsDesc}
        />
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Stat label="Validés" value={String(a.validated)} />
          <Stat label="Refusés" value={String(a.denied)} />
          <Stat label="Temps moyen" value={`${(a.avgValidationMs / 1000).toFixed(1)}s`} />
          <Stat label="Pic d'entrée" value={a.peakHour} />
        </div>
        <p className="eyebrow mb-3">Par porte</p>
        <ul className="space-y-2 mb-6">
          {gates
            .filter(([, n]) => n > 0)
            .sort((x, y) => y[1] - x[1])
            .map(([code, count]) => (
              <li
                key={code}
                className="flex justify-between items-center p-3 bg-surface border border-border rounded-xl text-sm"
              >
                <span>{gateLabel(code)}</span>
                <span className="font-mono text-muted-foreground">{count}</span>
              </li>
            ))}
        </ul>
        {a.topGate && (
          <p className="text-xs text-muted-foreground text-center">
            Porte la plus utilisée · {gateLabel(a.topGate)}
          </p>
        )}
      </div>
    </div>
  );
}
