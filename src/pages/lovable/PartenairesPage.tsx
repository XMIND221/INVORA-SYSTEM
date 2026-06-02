import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { PageHeader } from '@/components/lovable/PageHeader';
import { PartnerWorkflowStrip } from '@/components/lovable/PartnerWorkflowStrip';
import { Stat } from '@/components/lovable/Stat';
import { NextActionCard } from '@/components/lovable/NextActionCard';
import {
  lovablePartnerAnalytics,
  lovablePartnerCampaign,
  lovablePartnerWallet,
  lovablePartnerWithdrawals,
} from '@/lib/constants';
import { PARTNER_ENGINE_COPY } from '@/integration/lovable/product-copy';
import { useRole } from '@/integration/lovable/use-role';
import { usePartnerDashboard } from '@/hooks/usePartnerDashboard';
import { LoadingPage, PermissionDeniedState } from '@/components/lovable/ui-states';
import { useAuth } from '@/hooks/useAuth';

export default function PartenairesPage() {
  const role = useRole();
  if (role === 'partenaire') return <PartnerDashboard />;
  return <OrganizerPartnersView />;
}

function PartnerDashboard() {
  const { isAuthenticated } = useAuth();
  const { data, isLoading, isError } = usePartnerDashboard();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <PermissionDeniedState description="Connectez-vous avec un compte partenaire." />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingPage />
      </div>
    );
  }

  if (isError || !data?.profile) {
    return (
      <div className="px-6 py-12 text-center text-muted-foreground">
        Profil partenaire indisponible. Contactez INVORA pour activer votre compte.
      </div>
    );
  }

  const { profile, campaigns, analytics, wallet } = data;
  const top = campaigns.find((c) => c.isActive) ?? campaigns[0];

  return (
    <div className="pb-4">
      <RoleContextBar location="Promouvoir" />
      <div className="px-6">
        <PageHeader
          eyebrow="Partenaire INVORA"
          title={
            <>
              Distributeur
              <br />
              <span className="font-serif italic">d&apos;audience.</span>
            </>
          }
          description={PARTNER_ENGINE_COPY.subtitle}
        />

        <p className="font-mono text-[10px] tracking-widest text-muted-foreground mb-4">
          ID {profile.displayId} · Code {profile.partnerCode}
        </p>

        <PartnerWorkflowStrip currentStep={2} />

        {top ? (
          <NextActionCard
            title={`Partager ${top.eventTitle}`}
            description={`${top.universe.toUpperCase()} · ${top.conversions} conversions`}
            to={lovablePartnerCampaign(top.id)}
            cta="Ouvrir la campagne"
          />
        ) : null}

        <div className="grid grid-cols-2 gap-2 my-4">
          <Stat label="Disponible" value={`${wallet.availableFcfa.toLocaleString('fr-FR')} F`} />
          <Stat label="Commissions" value={`${analytics.commissionFcfa.toLocaleString('fr-FR')} F`} />
          <Stat label="Conversions" value={String(analytics.conversions)} />
          <Stat label="Clics" value={String(analytics.clicks)} />
        </div>

        <p className="eyebrow mb-3">Campagnes actives</p>
        <ul className="space-y-2 mb-6">
          {campaigns
            .filter((c) => c.isActive)
            .map((c) => (
              <li key={c.id}>
                <Link
                  to={lovablePartnerCampaign(c.id)}
                  className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border"
                >
                  <div>
                    <p className="text-sm font-medium">{c.eventTitle}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {c.universe.toUpperCase()} · {c.conversions} conv. · {c.clicks} clics
                    </p>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
        </ul>

        <div className="flex gap-4 justify-center text-[10px] uppercase tracking-[0.18em]">
          <Link to={lovablePartnerWallet()} className="text-muted-foreground hover:text-foreground">
            Wallet
          </Link>
          <Link to={lovablePartnerWithdrawals()} className="text-muted-foreground hover:text-foreground">
            Retraits
          </Link>
          <Link to={lovablePartnerAnalytics()} className="text-muted-foreground hover:text-foreground">
            Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}

function OrganizerPartnersView() {
  return (
    <div className="px-6 py-12 text-center text-muted-foreground text-sm">
      Espace organisateur — invitez des partenaires depuis le hub événement.
    </div>
  );
}
