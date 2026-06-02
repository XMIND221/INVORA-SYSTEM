import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LOVABLE_ROUTES, lovablePartnerWithdrawals } from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { Stat } from '@/components/lovable/Stat';
import { WITHDRAWAL_STATUS_LABEL } from '@/features/engines/partner.engine';
import { usePartnerDashboard, usePartnerWithdrawals } from '@/hooks/usePartnerDashboard';
import { LoadingPage } from '@/components/lovable/ui-states';

export default function PartnerWalletPage() {
  const { data, isLoading } = usePartnerDashboard();
  const partnerId = data?.profile?.id;
  const { data: withdrawals = [] } = usePartnerWithdrawals(partnerId);
  const wallet = data?.wallet ?? { availableFcfa: 0, pendingFcfa: 0, withdrawnFcfa: 0 };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingPage />
      </div>
    );
  }

  return (
    <div className="pb-4">
      <RoleContextBar location="Wallet partenaire" />
      <div className="px-6">
        <Link
          to={LOVABLE_ROUTES.partenaires}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          Dashboard
        </Link>

        <PageHeader
          eyebrow="Un seul wallet"
          title={
            <>
              INVITER
              <br />
              <span className="font-serif italic">+ VENDRE.</span>
            </>
          }
          description="Commissions unifiées — retrait unique (Supabase)."
        />

        <div className="grid grid-cols-3 gap-2 mt-4">
          <Stat label="Disponible" value={`${wallet.availableFcfa.toLocaleString('fr-FR')}`} />
          <Stat label="En attente" value={`${wallet.pendingFcfa.toLocaleString('fr-FR')}`} />
          <Stat label="Retiré" value={`${wallet.withdrawnFcfa.toLocaleString('fr-FR')}`} />
        </div>

        <p className="eyebrow mt-6 mb-3">Historique retraits</p>
        <ul className="space-y-2">
          {withdrawals.length === 0 ? (
            <li className="text-sm text-muted-foreground p-4 border border-dashed border-border rounded-xl text-center">
              Aucun retrait pour le moment.
            </li>
          ) : (
            withdrawals.map((w) => (
              <li
                key={w.id}
                className="p-4 rounded-xl bg-surface border border-border flex justify-between"
              >
                <span className="font-mono text-sm">{w.amountFcfa.toLocaleString('fr-FR')} FCFA</span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  {WITHDRAWAL_STATUS_LABEL[w.status]}
                </span>
              </li>
            ))
          )}
        </ul>

        <Link
          to={lovablePartnerWithdrawals()}
          className="mt-6 block text-center py-3 border border-border rounded-xl text-sm"
        >
          Demander un retrait
        </Link>
      </div>
    </div>
  );
}
