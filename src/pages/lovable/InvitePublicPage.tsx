import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download, Wallet, Shield } from 'lucide-react';
import { inviterService } from '@/services/inviter.service';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { InviterStatusBadge } from '@/components/lovable/InviterStatusBadge';
import { INVITER_ENGINE_COPY } from '@/integration/lovable/product-copy';
import type { PublicInvitationView } from '@/types/inviter';

export default function InvitePublicPage() {
  const { token } = useParams<{ token: string }>();
  const [claimed, setClaimed] = useState(false);
  const [view, setView] = useState<PublicInvitationView | null>(null);

  useEffect(() => {
    if (token) setView(inviterService.getPublicInvitation(token));
  }, [token]);

  if (!token || !view) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">Lien d’accès invalide ou expiré.</p>
      </div>
    );
  }

  const handleClaim = () => {
    const userId = 'demo-user';
    const result = inviterService.claim(token, userId);
    if (result) setClaimed(true);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="px-6 pt-12">
        <p className="eyebrow mb-2">INVORA · Accès privé</p>
        <h1 className="font-serif italic text-3xl">{view.eventTitle}</h1>
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground mt-2 uppercase">
          {view.eventDate} · {view.eventLocation}
        </p>

        <div className="mt-6 p-5 rounded-2xl bg-surface border border-border">
          <p className="text-sm text-muted-foreground">Invité</p>
          <p className="text-lg font-medium mt-1">{view.guestName}</p>
          <p className="text-[10px] uppercase tracking-[0.2em] mt-2 text-muted-foreground">
            {view.accessTypeLabel}
          </p>
          <div className="mt-3">
            <InviterStatusBadge status={view.status} />
          </div>
        </div>

        <div className="mt-6 p-6 flex flex-col items-center bg-surface border border-border rounded-2xl">
          <div className="p-3 bg-white rounded-2xl">
            <div className="size-40 grid grid-cols-10 gap-[2px]">
              {Array.from({ length: 100 }).map((_, i) => {
                const on = (i * 17 + token.length) % 5 < 2;
                return (
                  <div key={i} className={`rounded-[1px] ${on ? 'bg-black' : 'bg-black/5'}`} />
                );
              })}
            </div>
          </div>
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mt-4">
            {view.uniqueCode}
          </p>
          <p className="text-[9px] text-muted-foreground mt-2 text-center max-w-xs">
            QR unique · validation unique à l’entrée
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            type="button"
            className="flex flex-col items-center gap-1 py-3 border border-border rounded-xl text-[10px] uppercase tracking-[0.15em]"
          >
            <Download className="size-4" />
            Télécharger QR
          </button>
          {!view.claimed && !claimed ? (
            <button
              type="button"
              onClick={handleClaim}
              className="flex flex-col items-center gap-1 py-3 bg-primary text-primary-foreground rounded-xl text-[10px] uppercase tracking-[0.15em]"
            >
              <Wallet className="size-4" />
              Ajouter au wallet
            </button>
          ) : (
            <Link
              to={LOVABLE_ROUTES.acces}
              className="flex flex-col items-center justify-center gap-1 py-3 bg-primary text-primary-foreground rounded-xl text-[10px] uppercase tracking-[0.15em]"
            >
              <Wallet className="size-4" />
              Voir mon wallet
            </Link>
          )}
        </div>

        <p className="mt-6 text-xs text-muted-foreground flex items-start gap-2">
          <Shield className="size-4 shrink-0 mt-0.5" />
          {INVITER_ENGINE_COPY.noAccount}
        </p>

        <p className="mt-4 text-center font-mono text-[9px] tracking-widest text-muted-foreground">
          {view.secureLink}
        </p>
      </div>
    </div>
  );
}
