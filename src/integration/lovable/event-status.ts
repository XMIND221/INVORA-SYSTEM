import type { EventStatus } from '@/types/event';

/** Statuts produit affichés partout (organisateur). */
export type UniversalEventStatus = 'brouillon' | 'publie' | 'actif' | 'termine' | 'archive';

export const UNIVERSAL_STATUS_LABEL: Record<UniversalEventStatus, string> = {
  brouillon: 'Brouillon',
  publie: 'Publié',
  actif: 'Actif',
  termine: 'Terminé',
  archive: 'Archivé',
};

export const UNIVERSAL_STATUS_STYLE: Record<
  UniversalEventStatus,
  { dot: string; border: string; text: string }
> = {
  brouillon: {
    dot: 'bg-muted-foreground',
    border: 'border-border',
    text: 'text-muted-foreground',
  },
  publie: {
    dot: 'bg-foreground',
    border: 'border-border-strong',
    text: 'text-foreground',
  },
  actif: {
    dot: 'bg-success',
    border: 'border-success/40',
    text: 'text-foreground',
  },
  termine: {
    dot: 'bg-muted-foreground/60',
    border: 'border-border',
    text: 'text-muted-foreground',
  },
  archive: {
    dot: 'bg-muted-foreground/30',
    border: 'border-border',
    text: 'text-muted-foreground',
  },
};

/** Mappe le statut DB Supabase vers le statut universel UI. */
export function toUniversalStatus(dbStatus: EventStatus): UniversalEventStatus {
  switch (dbStatus) {
    case 'draft':
      return 'brouillon';
    case 'scheduled':
    case 'published':
      return 'publie';
    case 'live':
      return 'actif';
    case 'ended':
      return 'termine';
    case 'archived':
      return 'archive';
    default:
      return 'brouillon';
  }
}

export function universalStatusFromLabel(label: string): UniversalEventStatus | null {
  const entry = Object.entries(UNIVERSAL_STATUS_LABEL).find(([, v]) => v === label);
  return entry ? (entry[0] as UniversalEventStatus) : null;
}
