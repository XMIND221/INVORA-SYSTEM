import { Link } from 'react-router-dom';
import { Stat } from '@/components/lovable/Stat';
import { gateLabel } from '@/features/engines/scanner.engine';
import type { ScannerLiveStats } from '@/types/scanner';

export function ScannerLivePanel({
  stats,
  historyLink,
  analyticsLink,
}: {
  stats: ScannerLiveStats;
  historyLink: string;
  analyticsLink: string;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Stat label="Entrées" value={String(stats.entered)} trend={`${stats.presenceRate}%`} />
        <Stat label="Attendus" value={String(stats.expected)} />
        <Stat label="Refusés" value={String(stats.denied)} />
        <Stat label="Validation" value={`${(stats.avgValidationMs / 1000).toFixed(1)}s`} />
      </div>
      {stats.topGate && (
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Porte active · {gateLabel(stats.topGate)}
          {stats.recentIncidents > 0 && ` · ${stats.recentIncidents} incident(s)`}
        </p>
      )}
      <div className="flex gap-3 text-[10px] uppercase tracking-[0.18em]">
        <Link to={historyLink} className="text-muted-foreground hover:text-foreground">
          Historique
        </Link>
        <Link to={analyticsLink} className="text-muted-foreground hover:text-foreground">
          Analytics terrain
        </Link>
      </div>
    </div>
  );
}
