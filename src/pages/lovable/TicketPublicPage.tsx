import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download, Mail, MessageCircle, Wallet } from 'lucide-react';
import { LOVABLE_ROUTES, lovableTicketPublic } from '@/lib/constants';
import { vendreService } from '@/services/vendre.service';
import { canIssueTicketAccess } from '@/features/engines/vendre.engine';
import { VENDRE_ENGINE_COPY } from '@/integration/lovable/product-copy';
import { usePublicTicket } from '@/hooks/usePublicTicket';
import { useAuth } from '@/hooks/useAuth';
import { useInvalidateWallet } from '@/hooks/useWalletAccesses';
import { TicketQrDisplay } from '@/components/lovable/TicketQrDisplay';
import {
  LoadingPage,
  NetworkErrorState,
  NotFoundState,
  PermissionDeniedState,
} from '@/components/lovable/ui-states';

export default function TicketPublicPage() {
  const { token } = useParams<{ token: string }>();
  const { user, isAuthenticated } = useAuth();
  const invalidateWallet = useInvalidateWallet();
  const { data, isLoading, isError, refetch } = usePublicTicket(token);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingPage />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background px-6 flex items-center">
        <NetworkErrorState
          message="Impossible de charger le billet."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background">
        <NotFoundState title="Billet introuvable" backTo="/" />
      </div>
    );
  }

  const { ticket, eventTitle, eventLocation, eventStartsAt } = data;

  if (!canIssueTicketAccess(ticket)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 text-center">
        <p className="text-muted-foreground">
          Accès en attente de paiement. {VENDRE_ENGINE_COPY.security}
        </p>
      </div>
    );
  }

  const handleClaim = async () => {
    if (!token || !user?.id) return;
    setClaiming(true);
    setClaimError(null);
    try {
      await vendreService.claim(token, user.id);
      invalidateWallet();
      void refetch();
    } catch (e) {
      setClaimError(e instanceof Error ? e.message : 'claim_failed');
    } finally {
      setClaiming(false);
    }
  };

  const shareUrl = lovableTicketPublic(token!);
  const waText = encodeURIComponent(`Votre billet INVORA : ${window.location.origin}${shareUrl}`);

  const distribute = async (channel: 'email' | 'whatsapp' | 'link' | 'download') => {
    if (!token) return;
    if (channel === 'whatsapp') {
      window.open(`https://wa.me/?text=${waText}`, '_blank', 'noopener');
    }
    if (channel === 'link') {
      await navigator.clipboard.writeText(`${window.location.origin}${shareUrl}`);
    }
    try {
      await vendreService.logDistribution(token, channel, user?.id);
    } catch {
      /* audit optionnel si non connecté */
    }
  };

  const claimed = ticket.claimed;

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="px-6 pt-12">
        <p className="eyebrow">INVORA Pass</p>
        <h1 className="font-serif italic text-3xl mt-2">{eventTitle}</h1>
        <p className="text-sm text-muted-foreground mt-1">{ticket.ticketTypeName}</p>
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground mt-2">
          {ticket.buyerFirstName} {ticket.buyerLastName}
        </p>
        {(eventStartsAt || eventLocation) && (
          <p className="text-xs text-muted-foreground mt-2">
            {eventStartsAt ? new Date(eventStartsAt).toLocaleString('fr-FR') : ''}
            {eventLocation ? ` · ${eventLocation}` : ''}
          </p>
        )}

        <div className="mt-6 p-6 flex flex-col items-center bg-surface border border-border rounded-2xl">
          <TicketQrDisplay payload={ticket.qrPayload} codeLabel={ticket.uniqueCode} />
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
            Statut : {ticket.scannedAt ? 'utilisé' : ticket.paymentStatus}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            type="button"
            onClick={() => void distribute('email')}
            className="py-3 border border-border rounded-xl flex flex-col items-center gap-1 text-[9px] uppercase"
          >
            <Mail className="size-4" />
            Email
          </button>
          <button
            type="button"
            onClick={() => void distribute('whatsapp')}
            className="py-3 border border-border rounded-xl flex flex-col items-center gap-1 text-[9px] uppercase"
          >
            <MessageCircle className="size-4" />
            WhatsApp
          </button>
          <button
            type="button"
            onClick={() => void distribute('download')}
            className="py-3 border border-border rounded-xl flex flex-col items-center gap-1 text-[9px] uppercase"
          >
            <Download className="size-4" />
            QR
          </button>
        </div>

        {!claimed ? (
          isAuthenticated ? (
            <>
              <button
                type="button"
                onClick={() => void handleClaim()}
                disabled={claiming}
                className="mt-4 w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Wallet className="size-4" />
                {claiming ? 'Ajout…' : 'Ajouter à Mes accès'}
              </button>
              {claimError ? (
                <p className="text-xs text-destructive mt-2 text-center">{claimError}</p>
              ) : null}
            </>
          ) : (
            <div className="mt-4">
              <PermissionDeniedState description="Connectez-vous pour ajouter ce billet à votre wallet." />
            </div>
          )
        ) : (
          <Link
            to={LOVABLE_ROUTES.acces}
            className="mt-4 block text-center py-3 bg-primary text-primary-foreground rounded-xl text-sm"
          >
            Ouvrir mon wallet
          </Link>
        )}

        <p className="mt-6 text-center font-mono text-[9px] text-muted-foreground break-all">
          {ticket.secureLink}
        </p>
      </div>
    </div>
  );
}
