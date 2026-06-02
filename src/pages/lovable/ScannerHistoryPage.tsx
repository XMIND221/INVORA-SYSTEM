import { Link } from 'react-router-dom';
import { ArrowLeft, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { denialReasonLabel, gateLabel } from '@/features/engines/scanner.engine';
import { SCANNER_ENGINE_COPY } from '@/integration/lovable/product-copy';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { useScannerHistory, useScannerSession } from '@/hooks/useScannerData';
import { LoadingPage } from '@/components/lovable/ui-states';

export default function ScannerHistoryPage() {
  const { data: session } = useScannerSession();
  const { data: history = [], isLoading } = useScannerHistory(session?.eventId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingPage />
      </div>
    );
  }

  return (
    <div className="pb-4">
      <RoleContextBar location="Historique scans" />
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
          title="Historique"
          description={SCANNER_ENGINE_COPY.historyDesc}
        />
        <ul className="space-y-2">
          {history.length === 0 ? (
            <li className="text-sm text-muted-foreground text-center py-8">Aucun scan enregistré.</li>
          ) : (
            history.map((r) => (
              <li key={r.id} className="p-4 bg-surface border border-border rounded-xl">
                <div className="flex items-start gap-3">
                  {r.status === 'validated' ? (
                    <Check className="size-4 text-[color:var(--color-success)] mt-0.5" />
                  ) : (
                    <X className="size-4 text-destructive mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{r.guestName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.accessTypeLabel} · {gateLabel(r.gateCode)} · {r.agentName}
                    </p>
                    {r.denialReason && (
                      <p className="text-xs text-destructive mt-1">{denialReasonLabel(r.denialReason)}</p>
                    )}
                    <p className="font-mono text-[10px] text-muted-foreground mt-2 truncate">
                      {r.passReference}
                    </p>
                  </div>
                  <time className="font-mono text-[10px] text-muted-foreground shrink-0">
                    {new Date(r.at).toLocaleTimeString('fr-FR')}
                  </time>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
