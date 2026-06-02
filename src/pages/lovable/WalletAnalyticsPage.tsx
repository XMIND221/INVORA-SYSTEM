import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { Stat } from '@/components/lovable/Stat';
import { WALLET_ENGINE_COPY } from '@/integration/lovable/product-copy';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { useWalletAnalytics } from '@/hooks/useWalletAccesses';
import { LoadingPage } from '@/components/lovable/ui-states';

export default function WalletAnalyticsPage() {
  const { data: a, isLoading } = useWalletAnalytics();

  if (isLoading || !a) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingPage />
      </div>
    );
  }

  return (
    <div className="pb-4">
      <RoleContextBar location="Analytics wallet" />
      <div className="px-6">
        <Link
          to={LOVABLE_ROUTES.acces}
          className="inline-flex items-center gap-2 text-xs text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3.5" />
          Wallet
        </Link>
        <PageHeader eyebrow="Wallet" title="Analytics" description={WALLET_ENGINE_COPY.analyticsDesc} />
        <div className="grid grid-cols-2 gap-3">
          <Stat label="Actifs" value={String(a.active)} />
          <Stat label="Utilisés" value={String(a.used)} />
          <Stat label="Expirés" value={String(a.expired)} />
          <Stat label="Taux utilisation" value={`${a.utilizationRate}%`} />
        </div>
      </div>
    </div>
  );
}
