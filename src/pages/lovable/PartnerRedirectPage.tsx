import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lovablePublicTicketing } from '@/lib/constants';
import { partnerService } from '@/services/partner.service';
import { setStoredPartnerCampaignCode } from '@/lib/partner-attribution';
import { NetworkErrorState } from '@/components/lovable/ui-states';

/** Lien traçable /p/:partnerCode/:eventId */
export default function PartnerRedirectPage() {
  const { partnerCode, eventId } = useParams<{ partnerCode: string; eventId: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!partnerCode || !eventId) return;
    let timer: ReturnType<typeof setTimeout>;

    void partnerService
      .recordClick(partnerCode, eventId)
      .then((r) => {
        setStoredPartnerCampaignCode(r.campaignCode);
        timer = setTimeout(() => {
          navigate(`${lovablePublicTicketing(r.eventId)}?ref=${partnerCode}`);
        }, 400);
      })
      .catch(() => {
        setError('tracking_failed');
        timer = setTimeout(() => navigate(lovablePublicTicketing(eventId)), 800);
      });

    return () => clearTimeout(timer);
  }, [partnerCode, eventId, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-background px-6 flex items-center">
        <NetworkErrorState message="Lien partenaire invalide ou événement introuvable." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Redirection partenaire…</p>
    </div>
  );
}
