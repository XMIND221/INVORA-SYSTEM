import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Download, Mail, MessageCircle, Wallet } from 'lucide-react';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { vendreService } from '@/services/vendre.service';
import { canIssueTicketAccess } from '@/features/engines/vendre.engine';
import { VENDRE_ENGINE_COPY } from '@/integration/lovable/product-copy';

export default function TicketPublicPage() {
  const { token } = useParams<{ token: string }>();
  const [claimed, setClaimed] = useState(false);
  const ticket = token ? vendreService.getPublicTicket(token) : undefined;

  if (!ticket) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Billet introuvable.</p>
      </div>
    );
  }

  if (!canIssueTicketAccess(ticket)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 text-center">
        <p className="text-muted-foreground">
          Accès en attente de paiement. {VENDRE_ENGINE_COPY.security}
        </p>
      </div>
    );
  }

  const handleClaim = () => {
    const r = vendreService.claim(token!, 'demo-user');
    if (r) setClaimed(true);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="px-6 pt-12">
        <p className="eyebrow">INVORA Pass</p>
        <h1 className="font-serif italic text-3xl mt-2">{ticket.ticketTypeName}</h1>
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground mt-2">
          {ticket.buyerFirstName} {ticket.buyerLastName}
        </p>

        <div className="mt-6 p-6 flex flex-col items-center bg-surface border border-border rounded-2xl">
          <div className="p-3 bg-white rounded-2xl">
            <div className="size-40 grid grid-cols-10 gap-[2px]">
              {Array.from({ length: 100 }).map((_, i) => {
                const on = (i * 13 + token!.length) % 4 < 2;
                return (
                  <div key={i} className={`rounded-[1px] ${on ? 'bg-black' : 'bg-black/5'}`} />
                );
              })}
            </div>
          </div>
          <p className="font-mono text-[10px] tracking-[0.3em] mt-4">{ticket.uniqueCode}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <button type="button" className="py-3 border border-border rounded-xl flex flex-col items-center gap-1 text-[9px] uppercase">
            <Mail className="size-4" />
            Email
          </button>
          <button type="button" className="py-3 border border-border rounded-xl flex flex-col items-center gap-1 text-[9px] uppercase">
            <MessageCircle className="size-4" />
            WhatsApp
          </button>
          <button type="button" className="py-3 border border-border rounded-xl flex flex-col items-center gap-1 text-[9px] uppercase">
            <Download className="size-4" />
            QR
          </button>
        </div>

        {!ticket.claimed && !claimed ? (
          <button
            type="button"
            onClick={handleClaim}
            className="mt-4 w-full py-3 bg-primary text-primary-foreground rounded-xl text-sm flex items-center justify-center gap-2"
          >
            <Wallet className="size-4" />
            Ajouter à Mes accès
          </button>
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
