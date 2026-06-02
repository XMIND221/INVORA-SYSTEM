import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { CheckoutTrustBar } from '@/components/lovable/CheckoutTrustBar';
import { PaymentProviderSelect } from '@/components/lovable/PaymentProviderSelect';
import { formatFcfa } from '@/features/engines/payments.engine';
import { lovablePaymentStatus } from '@/lib/constants';
import { completeCheckoutAfterProvider, loadProviders, startCheckout } from '@/services/checkout.service';
import type { CheckoutFlowInput } from '@/services/checkout.service';
import type { CheckoutInitResult, PaymentProvider } from '@/types/payments';

export default function CheckoutPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [providerId, setProviderId] = useState('wave');
  const [checkout, setCheckout] = useState<CheckoutInitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const universe = (params.get('universe') ?? 'vendre') as CheckoutFlowInput['universe'];
  const amountFcfa = Number(params.get('amount') ?? 0);

  useEffect(() => {
    void loadProviders().then((list) => {
      setProviders(list);
      if (list[0]) setProviderId(list[0].id);
    });
  }, []);

  useEffect(() => {
    if (attemptId && amountFcfa > 0) {
      setCheckout({
        paymentAttemptId: attemptId,
        transactionId: params.get('tx') ?? '',
        amountFcfa,
        currency: 'XOF',
        checkoutUrl: `/checkout/${attemptId}`,
      });
    }
  }, [attemptId, amountFcfa, params]);

  const handlePay = async () => {
    if (!checkout) return;
    setLoading(true);
    setError(null);
    const result = await completeCheckoutAfterProvider(
      checkout.paymentAttemptId,
      providerId,
      checkout.amountFcfa,
    );
    setLoading(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    navigate(
      `${lovablePaymentStatus(checkout.paymentAttemptId)}?status=${result.status}&universe=${universe}`,
    );
  };

  const handleStart = async () => {
    const eventId = params.get('eventId');
    if (!eventId || universe !== 'vendre') return;
    setLoading(true);
    const input: CheckoutFlowInput = {
      universe: 'vendre',
      eventId,
      ticketTypeId: params.get('type') ?? '',
      quantity: Number(params.get('qty') ?? 1),
      buyerName: params.get('name') ?? '',
      buyerPhone: params.get('phone') ?? '',
      buyerEmail: params.get('email') ?? undefined,
      providerId,
    };
    const result = await startCheckout(input);
    setLoading(false);
    if ('error' in result) {
      setError(result.error);
      return;
    }
    setCheckout(result);
  };

  const displayAmount = checkout?.amountFcfa ?? amountFcfa;

  return (
    <div className="min-h-screen bg-background text-foreground pb-10">
      <div className="mx-auto max-w-md px-6 pt-8">
        <Link
          to={params.get('back') ?? '/'}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-6"
        >
          <ArrowLeft className="size-3" />
          Retour
        </Link>

        <p className="eyebrow mb-2">Paiement</p>
        <h1 className="font-serif italic text-3xl">Finaliser en toute sécurité</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Le montant est validé par le serveur après confirmation du fournisseur.
        </p>

        <div className="mt-8 p-5 rounded-2xl border border-border bg-surface">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Total</div>
          <div className="text-3xl font-light mt-1">{formatFcfa(displayAmount)}</div>
        </div>

        <div className="mt-6">
          <PaymentProviderSelect providers={providers} value={providerId} onChange={setProviderId} />
        </div>

        <CheckoutTrustBar />

        {error ? <p className="text-sm text-destructive mt-4">{error}</p> : null}

        <div className="mt-6 space-y-3">
          {!checkout && universe === 'vendre' ? (
            <button
              type="button"
              onClick={() => void handleStart()}
              disabled={loading}
              className="w-full py-4 rounded-full bg-primary text-primary-foreground text-sm font-medium"
            >
              {loading ? <Loader2 className="size-4 animate-spin mx-auto" /> : 'Préparer le paiement'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handlePay()}
              disabled={loading || !checkout}
              className="w-full py-4 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {loading ? <Loader2 className="size-4 animate-spin mx-auto" /> : 'Confirmer le paiement'}
            </button>
          )}
        </div>

        <p className="text-[11px] text-center text-muted-foreground mt-6">
          Provider → Webhook → Backend. Aucune validation côté navigateur.
        </p>
      </div>
    </div>
  );
}
