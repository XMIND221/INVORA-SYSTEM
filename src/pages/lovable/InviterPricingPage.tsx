import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { InviterPricingCard } from '@/components/lovable/InviterPricingCard';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { FINANCE_ENGINE_COPY } from '@/integration/lovable/product-copy';
import { lovableEventInviter, LOVABLE_ROUTES } from '@/lib/constants';
import { useOrganizerEventParam } from '@/hooks/useOrganizerEvent';
import { inviterService } from '@/services/inviter.service';

export default function InviterPricingPage() {
  const { eventId, event } = useOrganizerEventParam();
  const [addQty, setAddQty] = useState(12);
  const guests = eventId ? inviterService.listGuests(eventId) : [];
  const existing = guests.length;

  if (!eventId) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;
  if (!event) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;

  return (
    <div className="pb-4">
      <RoleContextBar location="Tarifs INVITER" />
      <div className="px-6">
        <Link
          to={lovableEventInviter(eventId)}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          INVITER
        </Link>
        <PageHeader
          eyebrow="Grille officielle"
          title="Tarification"
          description={FINANCE_ENGINE_COPY.inviterDesc}
        />
        <p className="text-sm text-muted-foreground mb-4">
          {existing} accès déjà créés sur cet événement.
        </p>
        <label className="block mb-4">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Accès à ajouter (simulation)
          </span>
          <input
            type="number"
            min={1}
            max={500}
            value={addQty}
            onChange={(e) => setAddQty(Number(e.target.value) || 1)}
            className="w-full mt-2 px-4 py-3 bg-surface border border-border rounded-xl font-mono"
          />
        </label>
        <InviterPricingCard quantity={addQty} existingCount={existing} />
      </div>
    </div>
  );
}
