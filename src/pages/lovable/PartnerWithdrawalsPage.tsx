import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LOVABLE_ROUTES, lovablePartnerWallet } from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { partnerService } from '@/services/partner.service';

export default function PartnerWithdrawalsPage() {
  const [amount, setAmount] = useState(84050);
  const [done, setDone] = useState(false);
  const wallet = partnerService.walletSummary();

  const handleRequest = () => {
    const r = partnerService.requestWithdrawal(amount);
    if (!('error' in r)) setDone(true);
  };

  return (
    <div className="pb-4">
      <RoleContextBar location="Retraits" />
      <div className="px-6">
        <Link
          to={LOVABLE_ROUTES.partenaires}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          Dashboard
        </Link>

        <PageHeader
          eyebrow="Retrait"
          title={
            <>
              Demande
              <br />
              <span className="font-serif italic">SEPA.</span>
            </>
          }
          description="Architecture prête — intégration bancaire Phase ultérieure."
        />

        <p className="text-sm text-muted-foreground mb-4">
          Disponible : {wallet.availableFcfa.toLocaleString('fr-FR')} FCFA
        </p>

        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
          className="w-full p-3 mb-4 border border-border rounded-lg bg-surface font-mono"
        />

        {done && (
          <p className="text-xs text-[color:var(--color-success)] mb-4 p-3 border border-border rounded-lg">
            Demande enregistrée — statut En attente. Commission figée à la transaction.
          </p>
        )}

        <button
          type="button"
          onClick={handleRequest}
          className="w-full py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-medium"
        >
          Soumettre la demande
        </button>

        <Link
          to={lovablePartnerWallet()}
          className="mt-4 block text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
        >
          Retour wallet
        </Link>
      </div>
    </div>
  );
}
