export const APP_NAME = 'INVORA';

export const EVENT_UNIVERSES = ['inviter', 'vendre'] as const;

export const EVENT_VISIBILITY = ['private', 'public', 'unlisted'] as const;

export const EVENT_STATUS = ['draft', 'scheduled', 'published', 'live', 'ended', 'archived'] as const;

export const USER_ROLES = ['organisateur', 'participant', 'partenaire', 'scanner', 'admin'] as const;

export const STORAGE_BUCKETS = {
  media: 'event-media',
  avatars: 'avatars',
  qrAssets: 'qr-assets',
} as const;

export const ROUTES = {
  root: '/',
  auth: '/auth',
  dashboard: '/dashboard',
  events: '/events',
  wallet: '/wallet',
  scanner: '/scanner',
  partner: '/partner',
} as const;

/** Routes UI Lovable */
export const LOVABLE_ROUTES = {
  root: '/',
  accueil: '/accueil',
  evenements: '/evenements',
  creer: '/creer',
  acces: '/mes-acces',
  scanner: '/scanner',
  parcours: '/parcours',
  partenaires: '/partenaires',
  parametres: '/parametres',
} as const;
