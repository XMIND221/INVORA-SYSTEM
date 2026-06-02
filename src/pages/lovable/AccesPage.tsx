import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { AccessPassCard } from '@/components/lovable/AccessPassCard';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { WalletNotificationPrepList } from '@/components/lovable/WalletNotificationPrep';
import { WalletPassExportBar } from '@/components/lovable/WalletPassExportBar';
import { TicketQrDisplay } from '@/components/lovable/TicketQrDisplay';
import { groupAccessByWalletTab, WALLET_SECTION_LABEL } from '@/features/engines/access.engine';
import {
  WALLET_COPY,
  WALLET_ENGINE_COPY,
  INVITER_ENGINE_COPY,
} from '@/integration/lovable/product-copy';
import {
  lovableWalletAnalytics,
  lovableWalletHistory,
  lovableWalletSearch,
} from '@/lib/constants';
import { accessService } from '@/services/access.service';
import { useAuth } from '@/hooks/useAuth';
import { useInvalidateWallet, useWalletAccesses, useWalletAnalytics } from '@/hooks/useWalletAccesses';
import { LoadingPage, PermissionDeniedState } from '@/components/lovable/ui-states';
import type { InvoraAccess, WalletSectionTab } from '@/types/access';

const WALLET_TABS: WalletSectionTab[] = ['today', 'upcoming', 'used', 'expired', 'cancelled'];

export default function AccesPage() {
  const [tab, setTab] = useState<WalletSectionTab>('today');
  const { user, profile, isAuthenticated, isLoading: authLoading } = useAuth();
  const invalidate = useInvalidateWallet();
  const { data: accesses = [], isLoading, refetch } = useWalletAccesses();
  const { data: analytics } = useWalletAnalytics();

  const grouped = groupAccessByWalletTab(accesses);
  const primary = grouped.today[0] ?? grouped.upcoming[0] ?? grouped.used[0];

  const handleReconcile = () => {
    if (!user?.id) return;
    void accessService
      .reconcile({
        userId: user.id,
        phone: profile?.phone ?? undefined,
        email: profile?.email ?? user.email ?? undefined,
      })
      .then(() => {
        invalidate();
        void refetch();
      });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingPage />
      </div>
    );
  }

  if (!isAuthenticated || !user?.id) {
    return (
      <div className="min-h-screen bg-background">
        <PermissionDeniedState description="Connectez-vous pour voir vos billets et invitations." />
      </div>
    );
  }

  const stats = analytics ?? {
    active: 0,
    used: 0,
    expired: 0,
    cancelled: 0,
    utilizationRate: 0,
  };

  return (
    <div className="pb-4">
      <RoleContextBar location={WALLET_COPY.title} />
      <div className="px-6">
        <PageHeader
          eyebrow={WALLET_COPY.subtitle}
          title={
            <>
              {WALLET_COPY.title},
              <br />
              <span className="font-serif italic">en un geste.</span>
            </>
          }
          description={WALLET_ENGINE_COPY.hubDesc}
        />
        <p className="text-xs text-muted-foreground mb-3 p-3 border border-border rounded-lg bg-surface">
          {WALLET_COPY.notARole}
        </p>
        <p className="text-[10px] text-muted-foreground mb-4">{WALLET_ENGINE_COPY.noAccount}</p>

        {primary ? (
          <PrimaryPass access={primary} />
        ) : (
          <div className="p-6 mb-4 rounded-2xl border border-dashed border-border text-center text-sm text-muted-foreground">
            Aucun accès dans ce wallet pour le moment. Achetez un billet ou réclamez une invitation.
          </div>
        )}

        <div className="mt-4 mb-4">
          <WalletPassExportBar />
        </div>

        <button
          type="button"
          onClick={() => void handleReconcile()}
          className="w-full mb-4 py-3 flex items-center justify-center gap-2 border border-border rounded-xl text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="size-3.5" />
          Réconcilier mes accès
        </button>
        <p className="text-[10px] text-muted-foreground mb-4">
          {INVITER_ENGINE_COPY.reconcile} · {WALLET_ENGINE_COPY.reconcile}
        </p>

        <div className="grid grid-cols-3 gap-3 mb-4 py-3 border-y border-border">
          <div className="text-center">
            <p className="font-mono text-lg">{stats.active}</p>
            <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Actifs</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-lg">{stats.used}</p>
            <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Utilisés</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-lg">{stats.utilizationRate}%</p>
            <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Taux</p>
          </div>
        </div>

        <div className="flex gap-4 justify-center mb-4 text-[10px] uppercase tracking-[0.18em]">
          <Link to={lovableWalletHistory()} className="text-muted-foreground hover:text-foreground">
            Historique
          </Link>
          <Link to={lovableWalletSearch()} className="text-muted-foreground hover:text-foreground">
            Recherche
          </Link>
          <Link to={lovableWalletAnalytics()} className="text-muted-foreground hover:text-foreground">
            Analytics
          </Link>
        </div>

        <div className="grid grid-cols-5 gap-1 p-1 bg-surface border border-border rounded-xl mb-5">
          {WALLET_TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`py-2 text-[7px] uppercase tracking-[0.1em] rounded-lg transition ${
                tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {WALLET_SECTION_LABEL[t]}
            </button>
          ))}
        </div>

        <ul className="space-y-3">
          {grouped[tab].length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun accès dans cette section.
            </p>
          ) : (
            grouped[tab].map((a) => <AccessPassCard key={`${a.universe}-${a.accessId}`} access={a} />)
          )}
        </ul>

        <p className="eyebrow mt-8 mb-2">Notifications</p>
        <WalletNotificationPrepList />
      </div>
    </div>
  );
}

function PrimaryPass({ access }: { access: InvoraAccess }) {
  return (
    <article className="relative rounded-[28px] p-1 bg-gradient-to-b from-white/15 to-transparent">
      <div className="relative rounded-[24px] overflow-hidden border border-white/10 bg-surface">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <p className="eyebrow">Invora Pass · {access.universe.toUpperCase()}</p>
            <p className="font-serif italic text-2xl mt-1">{access.eventTitle}</p>
          </div>
          <span className="size-2 rounded-full bg-[color:var(--color-success)]" />
        </div>
        <div className="p-6 flex flex-col items-center">
          <TicketQrDisplay payload={access.qrCode} codeLabel={access.accessCode} size={176} />
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mt-4">
            {access.holderName}
          </p>
        </div>
      </div>
    </article>
  );
}
