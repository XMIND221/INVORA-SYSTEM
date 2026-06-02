import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { ACCESS_STATUS_LABEL } from '@/features/engines/access.engine';
import { WALLET_ENGINE_COPY } from '@/integration/lovable/product-copy';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { accessService } from '@/services/access.service';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { LoadingPage } from '@/components/lovable/ui-states';

export default function WalletHistoryPage() {
  const { user } = useAuth();
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['wallet-history', user?.id],
    queryFn: () => (user?.id ? accessService.history(user.id) : Promise.resolve([])),
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingPage />
      </div>
    );
  }

  return (
    <div className="pb-4">
      <RoleContextBar location="Historique wallet" />
      <div className="px-6">
        <Link
          to={LOVABLE_ROUTES.acces}
          className="inline-flex items-center gap-2 text-xs text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3.5" />
          Wallet
        </Link>
        <PageHeader eyebrow="Wallet" title="Historique" description={WALLET_ENGINE_COPY.historyDesc} />
        <ul className="space-y-2">
          {history.map((h) => (
            <li key={h.id} className="p-4 bg-surface border border-border rounded-xl">
              <div className="flex justify-between gap-2">
                <p className="font-medium">{h.eventTitle}</p>
                <time className="font-mono text-[10px] text-muted-foreground shrink-0">
                  {new Date(h.at).toLocaleDateString('fr-FR')}
                </time>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {h.accessTypeLabel} · {ACCESS_STATUS_LABEL[h.status]} · {h.universe}
              </p>
              {h.validation && (
                <p className="text-xs text-[color:var(--color-success)] mt-1">{h.validation}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
