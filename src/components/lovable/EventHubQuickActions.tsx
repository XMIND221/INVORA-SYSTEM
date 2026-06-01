import { Link } from 'react-router-dom';
import {
  BarChart3,
  Image,
  ScanLine,
  Send,
  Sparkles,
  Ticket,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  lovableEventAnalytics,
  lovableEventInviter,
  lovableEventVendre,
  lovableEventMedias,
  lovableEventRayonner,
  LOVABLE_ROUTES,
} from '@/lib/constants';
import type { EventUniverse } from '@/types/event';

interface EventHubQuickActionsProps {
  eventId: string;
  universe: EventUniverse;
}

interface ActionItem {
  label: string;
  description: string;
  to: string;
  icon: LucideIcon;
}

export function EventHubQuickActions({ eventId, universe }: EventHubQuickActionsProps) {
  const actions: ActionItem[] = [
    {
      label: universe === 'inviter' ? 'INVITER' : 'VENDRE',
      description: universe === 'inviter' ? 'Accès privés · invités' : 'Billets & publication',
      to: universe === 'inviter' ? lovableEventInviter(eventId) : lovableEventVendre(eventId),
      icon: universe === 'inviter' ? Send : Ticket,
    },
    {
      label: 'Partenaires',
      description: 'Promoteurs & commissions',
      to: LOVABLE_ROUTES.partenaires,
      icon: Users,
    },
    {
      label: 'Scanner',
      description: 'Contrôle des entrées',
      to: LOVABLE_ROUTES.scanner,
      icon: ScanLine,
    },
    {
      label: 'Analytics',
      description: 'Vues, scans, présence',
      to: lovableEventAnalytics(eventId),
      icon: BarChart3,
    },
    {
      label: 'Médias',
      description: 'Visuels Design Engine',
      to: lovableEventMedias(eventId),
      icon: Image,
    },
    {
      label: 'RAYONNER',
      description: 'Avant · Pendant · Après',
      to: lovableEventRayonner(eventId),
      icon: Sparkles,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
        <Link
          key={a.label}
          to={a.to}
          className="p-4 rounded-xl bg-surface border border-border hover:border-border-strong transition"
        >
          <Icon className="size-4 text-muted-foreground mb-2" strokeWidth={1.5} />
          <p className="text-sm font-medium">{a.label}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{a.description}</p>
        </Link>
        );
      })}
    </div>
  );
}
