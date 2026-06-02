import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { reconciliationSummary } from '@/features/engines/payment-reconciliation.engine';
import { reconcilePayment } from '@/services/payment.service';
import { partnerService } from '@/services/partner.service';
import {
  clearStoredPartnerCampaignCode,
  getStoredPartnerCampaignCode,
} from '@/lib/partner-attribution';
import { lovableTicketPublic } from '@/lib/constants';
import type { ReconciliationResult } from '@/types/payments';
import { NetworkErrorState } from '@/components/lovable/ui-states';

export default function PaymentStatusPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get('status') ?? 'pending';
  const [recon, setRecon] = useState<ReconciliationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!attemptId) return;
    void reconcilePayment(attemptId)
      .then((r) => {
        setRecon(r);
        setLoading(false);
        if (r && status === 'paid' && r.transactionId) {
          const campaignCode = getStoredPartnerCampaignCode();
          if (campaignCode) {
            void partnerService
              .attributeVendreSale(r.transactionId, campaignCode)
              .then(() => clearStoredPartnerCampaignCode())
              .catch(() => {
                /* attribution optionnelle */
              });
          }
        }
      })
      .catch(() => {
        setLoadError(true);
        setLoading(false);
      });
  }, [attemptId, status]);

  const paid = status === 'paid';
  const universe = params.get('universe') ?? 'vendre';
  const ticketToken = recon?.primaryTicketToken;

  if (loadError) {
    return (
      <div className="min-h-screen bg-background px-6 flex items-center justify-center">
        <NetworkErrorState
          message="Impossible de vérifier le paiement."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      {loading ? (
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      ) : paid ? (
        <CheckCircle2 className="size-12 text-success mb-4" strokeWidth={1.5} />
      ) : (
        <XCircle className="size-12 text-destructive mb-4" strokeWidth={1.5} />
      )}

      <p className="eyebrow mb-2">{paid ? 'Paiement validé' : 'Paiement non validé'}</p>
      <h1 className="font-serif italic text-3xl">
        {paid ? 'Billet émis' : 'Échec ou en attente'}
      </h1>

      {paid && universe === 'vendre' ? (
        <p className="text-sm text-muted-foreground mt-4 max-w-xs">
          Votre billet a été créé. QR unique prêt pour le wallet et le scanner.
        </p>
      ) : null}

      {recon ? (
        <p className="text-sm text-muted-foreground mt-4 max-w-xs">{reconciliationSummary(recon)}</p>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 w-full max-w-xs">
        {paid && ticketToken ? (
          <button
            type="button"
            onClick={() => navigate(lovableTicketPublic(ticketToken))}
            className="w-full px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium"
          >
            Voir mon billet
          </button>
        ) : null}
        <Link
          to={params.get('next') ?? '/'}
          className="inline-flex justify-center px-6 py-3 rounded-full border border-border text-sm font-medium"
        >
          {paid && ticketToken ? 'Plus tard' : 'Continuer'}
        </Link>
      </div>
    </div>
  );
}
