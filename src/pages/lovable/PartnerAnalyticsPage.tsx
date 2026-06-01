import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { Stat } from '@/components/lovable/Stat';
import { partnerService } from '@/services/partner.service';

export default function PartnerAnalyticsPage() {
  const a = partnerService.analytics();
  const campaigns = partnerService.listCampaigns();

  return (
    <div className="pb-4">
      <RoleContextBar location="Analytics partenaire" />
      <div className="px-6">
        <Link
          to={LOVABLE_ROUTES.partenaires}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          Dashboard
        </Link>

        <PageHeader
          eyebrow="Analyser"
          title={
            <>
              Performance
              <br />
              <span className="font-serif italic">par campagne.</span>
            </>
          }
        />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <Stat label="Clics" value={String(a.clicks)} />
          <Stat label="Ouvertures" value={String(a.opens)} />
          <Stat label="Conversions" value={String(a.conversions)} />
          <Stat label="Invitations" value={String(a.invitations)} />
          <Stat label="Ventes" value={String(a.sales)} />
          <Stat label="Commissions" value={`${a.commissionFcfa.toLocaleString('fr-FR')} F`} />
        </div>

        <p className="eyebrow mt-6 mb-3">Par campagne</p>
        <ul className="space-y-2">
          {campaigns.map((c) => (
            <li key={c.id} className="p-4 rounded-xl bg-surface border border-border">
              <p className="font-medium">{c.eventTitle}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {c.clicks} clics · {c.conversions} conv. · {c.commissionFcfa} FCFA
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
