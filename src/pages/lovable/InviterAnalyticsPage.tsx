import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { lovableEventInviter, LOVABLE_ROUTES } from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { Stat } from '@/components/lovable/Stat';
import { InviterWorkflowStrip } from '@/components/lovable/InviterWorkflowStrip';
import { useOrganizerEventParam } from '@/hooks/useOrganizerEvent';
import { inviterService } from '@/services/inviter.service';

export default function InviterAnalyticsPage() {
  const { eventId, event } = useOrganizerEventParam();

  useEffect(() => {
    if (eventId) inviterService.initEvent(eventId);
  }, [eventId]);

  if (!eventId || !event) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;
  if (event.universe !== 'inviter') return <Navigate to={lovableEventInviter(eventId)} replace />;

  const a = inviterService.analytics(eventId);

  return (
    <div className="pb-4">
      <RoleContextBar location="Analytics INVITER" />
      <div className="px-6">
        <Link
          to={lovableEventInviter(eventId)}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          INVITER
        </Link>

        <PageHeader
          eyebrow="Analyser"
          title={
            <>
              Statistiques
              <br />
              <span className="font-serif italic">d’accès.</span>
            </>
          }
          description="Invitations créées, envoyées, ouvertes, réclamées, utilisées."
        />

        <InviterWorkflowStrip currentStep={6} compact />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <Stat label="Créées" value={String(a.created)} />
          <Stat label="Envoyées" value={String(a.sent)} />
          <Stat label="Ouvertes" value={String(a.opened)} />
          <Stat label="Réclamées" value={String(a.claimed)} />
          <Stat label="Utilisées (scan)" value={String(a.used)} />
          <Stat label="Taux de présence" value={`${a.attendanceRate}%`} />
        </div>

        <p className="text-xs text-muted-foreground mt-6 p-4 bg-surface border border-border rounded-xl">
          Chaque accès possède un lien et un QR uniques. Un scan = une validation horodatée — pas de
          doublon accepté au contrôle.
        </p>
      </div>
    </div>
  );
}
