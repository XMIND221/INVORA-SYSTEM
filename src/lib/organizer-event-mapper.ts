import type { Event } from '@/types/database';
import type { OrganizerEventRecord } from '@/types/organizer-event';
import type { EventStatus } from '@/types/event';

interface EventMetricsRow {
  views?: number;
  invitations_sent?: number;
  tickets_sold?: number;
  scans_total?: number;
  revenue_cents?: number;
}

function formatDateLabel(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).toUpperCase();
}

function journeyStepFromStatus(status: EventStatus): number {
  switch (status) {
    case 'draft':
      return 0;
    case 'scheduled':
      return 1;
    case 'published':
      return 2;
    case 'live':
      return 3;
    case 'ended':
    case 'archived':
      return 4;
    default:
      return 1;
  }
}

function universeFlowStep(status: EventStatus, universe: Event['universe']): number {
  const base = journeyStepFromStatus(status);
  if (universe === 'inviter') return Math.min(base, 4);
  return Math.min(base, 3);
}

export function mapEventToOrganizerView(
  event: Event,
  metrics?: EventMetricsRow | null,
): OrganizerEventRecord {
  const capacity = event.capacity ?? 0;
  const invitationsSent = metrics?.invitations_sent ?? 0;
  const ticketsSold = metrics?.tickets_sold ?? 0;
  const scans = metrics?.scans_total ?? 0;
  const views = metrics?.views ?? 0;
  const revenueCents = metrics?.revenue_cents ?? 0;

  const accessesMax = event.universe === 'inviter' ? capacity || 100 : 0;
  const ticketsMax = event.universe === 'vendre' ? capacity || 300 : 0;

  const conversions =
    views > 0
      ? Math.round(((event.universe === 'inviter' ? invitationsSent : ticketsSold) / views) * 100)
      : 0;

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    dateLabel: formatDateLabel(event.starts_at),
    location: event.location ?? '—',
    description: event.description ?? '',
    universe: event.universe,
    visibility: event.visibility,
    status: event.status,
    journeyStep: journeyStepFromStatus(event.status),
    universeFlowStep: universeFlowStep(event.status, event.universe),
    metrics: {
      accesses: invitationsSent,
      accessesMax,
      tickets: ticketsSold,
      ticketsMax,
      scans,
      conversions,
      revenueEur: Math.round(revenueCents / 100),
      partners: 0,
    },
    analytics: {
      views,
      invitationsSent,
      invitationsAccepted: invitationsSent,
      ticketsSold,
      scansDone: scans,
      attendanceRate: accessesMax > 0 ? Math.round((invitationsSent / accessesMax) * 100) : 0,
      activePartners: 0,
    },
  };
}
