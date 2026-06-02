import { Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, Ticket, BarChart3, Sparkles } from 'lucide-react';
import {
  lovableEventHub,
  lovableEventVendreAnalytics,
  lovableEventVendrePublish,
  lovableEventVendreRayonner,
  lovableEventVendreTickets,
  lovablePublicTicketing,
  LOVABLE_ROUTES,
} from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { VendreWorkflowStrip } from '@/components/lovable/VendreWorkflowStrip';
import { TicketingStatusBadge } from '@/components/lovable/TicketingStatusBadge';
import { Stat } from '@/components/lovable/Stat';
import { VENDRE_ENGINE_COPY } from '@/integration/lovable/product-copy';
import { useOrganizerEventParam } from '@/hooks/useOrganizerEvent';
import { assertVendreUniverse } from '@/features/engines/vendre.engine';
import { useEventTicketTypes } from '@/hooks/useEventTicketTypes';
import { useVendreAnalytics } from '@/hooks/useVendreAnalytics';

export default function VendreHubPage() {
  const { eventId, event } = useOrganizerEventParam();
  const { data: catalog } = useEventTicketTypes(eventId);
  const { data: analytics } = useVendreAnalytics(eventId);

  if (!eventId || !event) return <Navigate to={LOVABLE_ROUTES.evenements} replace />;
  try {
    assertVendreUniverse(event.universe);
  } catch {
    return <Navigate to={lovableEventHub(eventId)} replace />;
  }

  const status = catalog?.status ?? 'draft';
  const a = analytics ?? {
    pageViews: 0,
    cartAdds: 0,
    purchases: 0,
    conversionRate: 0,
    ticketsSold: 0,
    grossRevenueFcfa: 0,
    organizerRevenueFcfa: 0,
    invoraCommissionFcfa: 0,
  };

  return (
    <div className="pb-4">
      <RoleContextBar location="VENDRE" />
      <div className="px-6">
        <Link
          to={lovableEventHub(eventId)}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          Centre de contrôle
        </Link>

        <div className="flex items-center justify-between gap-2 mb-2">
          <PageHeader
            eyebrow={VENDRE_ENGINE_COPY.title}
            title={
              <>
                Billetterie
                <br />
                <span className="font-serif italic">publique.</span>
              </>
            }
            description={VENDRE_ENGINE_COPY.subtitle}
          />
          <TicketingStatusBadge status={status} />
        </div>

        <VendreWorkflowStrip currentStep={status === 'on_sale' ? 3 : 1} />

        <div className="grid grid-cols-3 gap-2 mb-4">
          <Stat label="Vendus" value={String(a.ticketsSold)} />
          <Stat label="CA" value={`${(a.grossRevenueFcfa / 1000).toFixed(0)}k`} />
          <Stat label="Conversion" value={`${a.conversionRate}%`} />
        </div>

        <p className="text-xs text-muted-foreground mb-4 p-3 border border-border rounded-lg">
          {VENDRE_ENGINE_COPY.financeNote}
        </p>

        <div className="space-y-2">
          <HubLink
            to={lovableEventVendreTickets(eventId)}
            icon={<Ticket className="size-4" />}
            title="Types de billets"
            description="Standard, VIP, Premium…"
          />
          <HubLink
            to={lovableEventVendrePublish(eventId)}
            icon={<ArrowUpRight className="size-4" />}
            title="Publier la billetterie"
            description="Page publique premium"
          />
          <HubLink
            to={lovablePublicTicketing(eventId)}
            icon={<ArrowUpRight className="size-4" />}
            title="Voir la page publique"
            description="Aperçu acheteur"
          />
          <HubLink
            to={lovableEventVendreAnalytics(eventId)}
            icon={<BarChart3 className="size-4" />}
            title="Analytics VENDRE"
            description="CA, commission, conversion"
          />
          <HubLink
            to={lovableEventVendreRayonner(eventId)}
            icon={<Sparkles className="size-4" />}
            title="RAYONNER · Promo"
            description="Affiches, stories, QR partenaires"
          />
        </div>
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
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-[10px] text-muted-foreground">{description}</p>
      </div>
      <ArrowUpRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
