import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, UserPlus, Send, BarChart3, Coins } from 'lucide-react';
import {
  lovableEventHub,
  lovableEventInviterAnalytics,
  lovableEventInviterDistribute,
  lovableEventInviterGuests,
  lovableEventInviterPricing,
  LOVABLE_ROUTES,
} from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { InviterWorkflowStrip } from '@/components/lovable/InviterWorkflowStrip';
import { Stat } from '@/components/lovable/Stat';
import { INVITER_ENGINE_COPY } from '@/integration/lovable/product-copy';
import { useOrganizerEventParam } from '@/hooks/useOrganizerEvent';
import { inviterService } from '@/services/inviter.service';
import { assertInviterUniverse } from '@/features/engines/inviter.engine';

export default function InviterHubPage() {
  const { eventId, event } = useOrganizerEventParam();

  useEffect(() => {
    if (eventId) inviterService.initEvent(eventId);
  }, [eventId]);

  if (!eventId) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;
  if (!event) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;

  try {
    assertInviterUniverse(event.universe);
  } catch {
    return <Navigate to={lovableEventHub(eventId)} replace />;
  }

  const analytics = inviterService.analytics(eventId);
  const guests = inviterService.listGuests(eventId);

  return (
    <div className="pb-4">
      <RoleContextBar location="INVITER" />
      <div className="px-6">
        <Link
          to={lovableEventHub(eventId)}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          Centre de contrôle
        </Link>

        <PageHeader
          eyebrow={INVITER_ENGINE_COPY.title}
          title={
            <>
              Accès
              <br />
              <span className="font-serif italic">privés.</span>
            </>
          }
          description={INVITER_ENGINE_COPY.subtitle}
        />

        <InviterWorkflowStrip currentStep={3} />

        <div className="grid grid-cols-3 gap-2 mb-6">
          <Stat label="Créés" value={String(analytics.created)} />
          <Stat label="Envoyés" value={String(analytics.sent)} />
          <Stat label="Réclamés" value={String(analytics.claimed)} />
        </div>

        <p className="text-xs text-muted-foreground mb-4 p-3 border border-border rounded-lg bg-surface">
          {INVITER_ENGINE_COPY.noAccount}
        </p>

        <div className="space-y-2">
          <HubLink
            to={lovableEventInviterGuests(eventId)}
            icon={<UserPlus className="size-4" />}
            title="Gérer les invités"
            description={`${guests.length} invités · nom, téléphone, type d’accès`}
          />
          <HubLink
            to={lovableEventInviterDistribute(eventId)}
            icon={<Send className="size-4" />}
            title="Distribuer"
            description="WhatsApp · Email · ou les deux"
          />
          <HubLink
            to={lovableEventInviterPricing(eventId)}
            icon={<Coins className="size-4" />}
            title="Tarification"
            description="Paliers officiels · devis serveur"
          />
          <HubLink
            to={lovableEventInviterAnalytics(eventId)}
            icon={<BarChart3 className="size-4" />}
            title="Analytics INVITER"
            description={`Présence ${analytics.attendanceRate}%`}
          />
          <HubLink
            to={`${LOVABLE_ROUTES.parcours}?univers=inviter&event=${eventId}`}
            icon={<ArrowUpRight className="size-4" />}
            title="Parcours détaillé"
            description="Étapes opérationnelles"
          />
        </div>

        <p className="mt-6 text-[10px] font-mono tracking-widest text-muted-foreground text-center">
          {INVITER_ENGINE_COPY.security}
        </p>
      </div>
    </div>
  );
}

function HubLink({
  to,
  icon,
  title,
  description,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border hover:border-border-strong transition"
    >
      <span className="text-muted-foreground">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
