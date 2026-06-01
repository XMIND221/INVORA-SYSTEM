import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lovablePublicTicketing } from '@/lib/constants';
import { partnerService } from '@/services/partner.service';

/** Lien traçable /p/:partnerCode/:eventId */
export default function PartnerRedirectPage() {
  const { partnerCode, eventId } = useParams<{ partnerCode: string; eventId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const campaign = partnerService
      .listCampaigns()
      .find((c) => c.eventId === eventId && c.campaignCode.startsWith(partnerCode ?? ''));
    if (campaign) partnerService.trackClick(campaign.id);

    if (eventId) {
      const t = setTimeout(() => {
        if (eventId === 'showcase-06') {
          navigate(lovablePublicTicketing(eventId));
        } else {
          navigate(lovablePublicTicketing(eventId));
        }
      }, 400);
      return () => clearTimeout(t);
    }
  }, [partnerCode, eventId, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Redirection partenaire…</p>
    </div>
  );
}
