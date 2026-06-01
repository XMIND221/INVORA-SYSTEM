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
import { partnerService } from '@/services/partner.service';
import { useRole } from '@/integration/lovable/use-role';

export default function PartenairesPage() {
  const role = useRole();
  if (role === 'partenaire') return <PartnerDashboard />;
  return <OrganizerPartnersView />;
}

function PartnerDashboard() {
  const profile = partnerService.getProfile();
  const campaigns = partnerService.listCampaigns();
  const analytics = partnerService.analytics();
  const wallet = partnerService.walletSummary();

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

        <NextActionCard
          title="Partager Showcase 06"
          description="Media kit prêt · lien traçable · VENDRE"
          to={lovablePartnerCampaign('pc-showcase')}
          cta="Ouvrir la campagne"
        />

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
                      {c.universe.toUpperCase()} · {c.conversions} conv.
                    </p>
                  </div>
                  <ArrowUpRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
        </ul>

        <div className="grid grid-cols-2 gap-2">
          <Link
            to={lovablePartnerWallet()}
            className="py-3 text-center border border-border rounded-xl text-[10px] uppercase tracking-[0.2em]"
          >
            Wallet
          </Link>
          <Link
            to={lovablePartnerWithdrawals()}
            className="py-3 text-center border border-border rounded-xl text-[10px] uppercase tracking-[0.2em]"
          >
            Retraits
          </Link>
          <Link
            to={lovablePartnerAnalytics()}
            className="col-span-2 py-3 text-center border border-border rounded-xl text-[10px] uppercase tracking-[0.2em]"
          >
            Analytics
          </Link>
        </div>
      </div>
    </div>
  );
}

function OrganizerPartnersView() {
  return (
    <div className="pb-4">
      <RoleContextBar location="Partenaires" />
      <div className="px-6">
        <PageHeader
          eyebrow="Organisateur"
          title={
            <>
              Vos
              <br />
              <span className="font-serif italic">partenaires.</span>
            </>
          }
          description="Invitez des distributeurs — commissions calculées côté serveur."
        />
        <div className="p-5 bg-surface border border-border rounded-2xl text-sm text-muted-foreground">
          {PARTNER_ENGINE_COPY.organizerHint}
        </div>
      </div>
    </div>
  );
}
