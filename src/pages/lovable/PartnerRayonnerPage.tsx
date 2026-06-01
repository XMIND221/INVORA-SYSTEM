import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LOVABLE_ROUTES, lovablePartnerCampaign } from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { getPartnerRayonnerPhases } from '@/features/engines/partner.engine';
import { partnerService } from '@/services/partner.service';
import { getOrganizerEvent } from '@/integration/lovable/organizer-mock';

export default function PartnerRayonnerPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const campaign = partnerService.listCampaigns().find((c) => c.eventId === eventId);
  const event = eventId ? getOrganizerEvent(eventId) : undefined;
  const phases = getPartnerRayonnerPhases();

  if (!eventId || !event) return <Navigate to={LOVABLE_ROUTES.partenaires} replace />;

  return (
    <div className="pb-4">
      <RoleContextBar location="RAYONNER · Partenaire" />
      <div className="px-6">
        <Link
          to={campaign ? lovablePartnerCampaign(campaign.id) : LOVABLE_ROUTES.partenaires}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          Campagne
        </Link>

        <PageHeader
          eyebrow="RAYONNER"
          title={
            <>
              {event.title}
              <br />
              <span className="font-serif italic">après l&apos;événement.</span>
            </>
          }
          description="Résultats, remerciements, photos, albums, bilan."
        />

        <ul className="space-y-3 mt-6">
          {phases.map((p) => (
            <li key={p.key} className="p-5 rounded-2xl bg-surface border border-border">
              <p className="font-serif italic text-xl">{p.label}</p>
              <p className="text-sm text-muted-foreground mt-1">{p.description}</p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {p.actions.map((a) => (
                  <span
                    key={a}
                    className="text-[9px] uppercase tracking-[0.15em] px-2 py-0.5 border border-border rounded-full"
                  >
                    {a}
                  </span>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
