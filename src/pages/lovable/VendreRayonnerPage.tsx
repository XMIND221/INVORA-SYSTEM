import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import { lovableEventVendre, LOVABLE_ROUTES, lovablePublicTicketing } from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { getVendrePromoAssets } from '@/features/engines/vendre.engine';
import { useOrganizerEventParam } from '@/hooks/useOrganizerEvent';

export default function VendreRayonnerPage() {
  const { eventId, event } = useOrganizerEventParam();
  const assets = getVendrePromoAssets();

  if (!eventId || !event) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;
  if (event.universe !== 'vendre') return <Navigate to={lovableEventVendre(eventId)} replace />;

  return (
    <div className="pb-4">
      <RoleContextBar location="RAYONNER · VENDRE" />
      <div className="px-6">
        <Link
          to={lovableEventVendre(eventId)}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          VENDRE
        </Link>

        <PageHeader
          eyebrow="Promotion"
          title={
            <>
              Rayonner
              <br />
              <span className="font-serif italic">à la vente.</span>
            </>
          }
          description="Visuels et liens pour le moteur Partenaire (Phase ultérieure)."
        />

        <div className="space-y-3 mt-6">
          {assets.map((a) => (
            <article key={a.key} className="p-4 rounded-xl bg-surface border border-border">
              <div className="flex justify-between items-center mb-1">
                <p className="font-medium">{a.label}</p>
                {a.ready ? (
                  <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    Prêt
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    <Clock className="size-3" />
                    Bientôt
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{a.description}</p>
            </article>
          ))}
        </div>

        <p className="mt-6 text-center font-mono text-[10px] tracking-widest text-muted-foreground break-all">
          Lien partageable : {lovablePublicTicketing(eventId)}
        </p>
      </div>
    </div>
  );
}
