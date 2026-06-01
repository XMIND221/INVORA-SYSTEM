import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LOVABLE_ROUTES, lovablePublicTicketing, lovableInvitePublic } from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { MediaKitGrid } from '@/components/lovable/MediaKitGrid';
import { Stat } from '@/components/lovable/Stat';
import { distributionLabelForUniverse } from '@/features/engines/partner.engine';
import { getPartnerMediaKitAssets, buildPromoShareText } from '@/features/engines/media-kit.engine';
import { partnerService } from '@/services/partner.service';
import type { PartnerCommissionQuote } from '@/types/partner';

export default function PartnerCampaignPage() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const campaign = campaignId ? partnerService.getCampaign(campaignId) : undefined;
  const [quote, setQuote] = useState<PartnerCommissionQuote | null>(null);

  useEffect(() => {
    if (!campaign) return;
    const metric = campaign.universe === 'inviter' ? campaign.conversions : 15000;
    void partnerService.fetchCommissionQuote(campaign.universe, metric).then(setQuote);
  }, [campaign]);

  if (!campaign) return <Navigate to={LOVABLE_ROUTES.partenaires} replace />;

  const assets = getPartnerMediaKitAssets(campaign.eventTitle, campaign.universe, campaign.shareLink);
  const promoText = buildPromoShareText(campaign.eventTitle, campaign.shareLink, campaign.universe);

  return (
    <div className="pb-4">
      <RoleContextBar location="Campagne" />
      <div className="px-6">
        <Link
          to={LOVABLE_ROUTES.partenaires}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          Dashboard
        </Link>

        <PageHeader
          eyebrow={`${campaign.universe.toUpperCase()} · ${campaign.campaignCode}`}
          title={
            <>
              {campaign.eventTitle}
              <br />
              <span className="font-serif italic">Media kit.</span>
            </>
          }
          description={distributionLabelForUniverse(campaign.universe)}
        />

        <div className="grid grid-cols-3 gap-2 mb-4">
          <Stat label="Clics" value={String(campaign.clicks)} />
          <Stat label="Conv." value={String(campaign.conversions)} />
          <Stat
            label="Gain"
            value={quote ? `${quote.commissionFcfa} F` : `${campaign.commissionFcfa} F`}
          />
        </div>

        <p className="text-xs text-muted-foreground mb-4 p-3 border border-border rounded-lg">
          Lien traçable : {campaign.shareLink}
        </p>

        <MediaKitGrid
          assets={assets}
          onCopyLink={() => void navigator.clipboard?.writeText(campaign.shareLink)}
          onCopyText={() => void navigator.clipboard?.writeText(promoText)}
        />

        <Link
          to={
            campaign.universe === 'vendre'
              ? lovablePublicTicketing(campaign.eventId)
              : lovableInvitePublic('tok-aminata-obsidian')
          }
          className="mt-6 block text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
        >
          Aperçu destination invité/acheteur
        </Link>
      </div>
    </div>
  );
}
