import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { WalletPassExportBar } from '@/components/lovable/WalletPassExportBar';
import { TicketQrDisplay } from '@/components/lovable/TicketQrDisplay';
import {
  ACCESS_STATUS_LABEL,
  publicLinkForAccess,
} from '@/features/engines/access.engine';
import { claimStatusLabel, canClaimAccess } from '@/features/engines/claim.engine';
import { WALLET_ENGINE_COPY } from '@/integration/lovable/product-copy';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { accessService } from '@/services/access.service';
import { useAuth } from '@/hooks/useAuth';
import { useInvalidateWallet, useWalletAccesses } from '@/hooks/useWalletAccesses';
import { LoadingPage, NotFoundState } from '@/components/lovable/ui-states';

export default function AccessDetailPage() {
  const { accessId } = useParams<{ accessId: string }>();
  const { user } = useAuth();
  const { data: accesses = [], isLoading } = useWalletAccesses();
  const invalidate = useInvalidateWallet();
  const [claiming, setClaiming] = useState(false);

  const access = accessId ? accesses.find((a) => a.accessId === accessId) : undefined;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingPage />
      </div>
    );
  }

  if (!access) {
    return (
      <div className="min-h-screen bg-background">
        <NotFoundState title="Accès introuvable" backTo={LOVABLE_ROUTES.acces} backLabel="Wallet" />
      </div>
    );
  }

  const handleClaim = async () => {
    if (!user?.id) return;
    setClaiming(true);
    try {
      await accessService.claim(access.publicToken, user.id);
      invalidate();
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="pb-4">
      <RoleContextBar location="Fiche accès" />
      <div className="px-6">
        <Link
          to={LOVABLE_ROUTES.acces}
          className="inline-flex items-center gap-2 text-xs text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3.5" />
          Wallet
        </Link>
        <PageHeader
          eyebrow={access.accessTypeLabel}
          title={access.eventTitle}
          description={`${access.eventDate ?? ''} · ${access.eventLocation ?? ''}`}
        />

        <div className="p-6 flex flex-col items-center bg-surface border border-border rounded-2xl mb-4">
          <TicketQrDisplay payload={access.qrCode} codeLabel={access.accessCode} />
          <p className="text-sm text-muted-foreground mt-1">{access.holderName}</p>
        </div>

        <dl className="space-y-3 mb-6 text-sm">
          <Row label="Statut" value={ACCESS_STATUS_LABEL[access.status]} />
          <Row label="Réclamation" value={claimStatusLabel(access)} />
          <Row label="Univers" value={access.universe.toUpperCase()} />
          <Row label="Type" value={access.accessTypeLabel} />
        </dl>

        <p className="eyebrow mb-2">{WALLET_ENGINE_COPY.detailInstructions}</p>
        <p className="text-sm text-muted-foreground mb-6">{access.instructions}</p>

        <WalletPassExportBar />

        <div className="flex flex-col gap-2 mt-6">
          <a
            href={publicLinkForAccess(access)}
            className="w-full py-3 text-center border border-border rounded-xl text-[10px] uppercase tracking-[0.2em]"
          >
            Ouvrir sans compte
          </a>
          {canClaimAccess(access) && user?.id && (
            <button
              type="button"
              disabled={claiming}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl text-[10px] uppercase tracking-[0.2em] disabled:opacity-60"
              onClick={() => void handleClaim()}
            >
              {claiming ? 'Réclamation…' : 'Réclamer dans mon wallet'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-border">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
