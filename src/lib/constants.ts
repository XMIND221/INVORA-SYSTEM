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
  crm: '/crm',
  parcours: '/parcours',
  partenaires: '/partenaires',
  parametres: '/parametres',
  finance: '/finance',
} as const;

export const STUDIO_STEPS = 5 as const;

export function lovableEventHub(eventId: string): string {
  return `${LOVABLE_ROUTES.evenements}/${eventId}`;
}

export function lovableEventAnalytics(eventId: string): string {
  return `${LOVABLE_ROUTES.evenements}/${eventId}/analytics`;
}

export function lovableEventRayonner(eventId: string): string {
  return `${LOVABLE_ROUTES.evenements}/${eventId}/rayonner`;
}

export function lovableEventMedias(eventId: string): string {
  return `${LOVABLE_ROUTES.evenements}/${eventId}/medias`;
}

export function lovableEventInviter(eventId: string): string {
  return `${LOVABLE_ROUTES.evenements}/${eventId}/inviter`;
}

export function lovableEventInviterGuests(eventId: string): string {
  return `${LOVABLE_ROUTES.evenements}/${eventId}/inviter/guests`;
}

export function lovableEventInviterDistribute(eventId: string): string {
  return `${LOVABLE_ROUTES.evenements}/${eventId}/inviter/distribuer`;
}

export function lovableEventInviterAnalytics(eventId: string): string {
  return `${LOVABLE_ROUTES.evenements}/${eventId}/inviter/analytics`;
}

export function lovableInvitePublic(token: string): string {
  return `/invite/${token}`;
}

export function lovableEventVendre(eventId: string): string {
  return `${LOVABLE_ROUTES.evenements}/${eventId}/vendre`;
}

export function lovableEventVendreTickets(eventId: string): string {
  return `${LOVABLE_ROUTES.evenements}/${eventId}/vendre/billets`;
}

export function lovableEventVendrePublish(eventId: string): string {
  return `${LOVABLE_ROUTES.evenements}/${eventId}/vendre/publier`;
}

export function lovableEventVendreAnalytics(eventId: string): string {
  return `${LOVABLE_ROUTES.evenements}/${eventId}/vendre/analytics`;
}

export function lovableEventVendreRayonner(eventId: string): string {
  return `${LOVABLE_ROUTES.evenements}/${eventId}/vendre/rayonner`;
}

export function lovablePublicTicketing(eventId: string): string {
  return `/billetterie/${eventId}`;
}

export function lovableTicketPurchase(eventId: string): string {
  return `/billetterie/${eventId}/acheter`;
}

export function lovableCheckout(paymentAttemptId: string): string {
  return `/checkout/${paymentAttemptId}`;
}

export function lovablePaymentStatus(paymentAttemptId: string): string {
  return `/paiement/statut/${paymentAttemptId}`;
}

export function lovableTicketPublic(token: string): string {
  return `/ticket/${token}`;
}

export function lovablePartnerCampaign(campaignId: string): string {
  return `${LOVABLE_ROUTES.partenaires}/campagnes/${campaignId}`;
}

export function lovablePartnerWallet(): string {
  return `${LOVABLE_ROUTES.partenaires}/wallet`;
}

export function lovablePartnerWithdrawals(): string {
  return `${LOVABLE_ROUTES.partenaires}/retraits`;
}

export function lovablePartnerAnalytics(): string {
  return `${LOVABLE_ROUTES.partenaires}/analytics`;
}

export function lovablePartnerRayonner(eventId: string): string {
  return `${LOVABLE_ROUTES.partenaires}/rayonner/${eventId}`;
}

export function lovablePartnerTrackLink(partnerCode: string, eventId: string): string {
  return `/p/${partnerCode}/${eventId}`;
}

export function lovableScannerHistory(): string {
  return `${LOVABLE_ROUTES.scanner}/historique`;
}

export function lovableScannerAnalytics(): string {
  return `${LOVABLE_ROUTES.scanner}/analytics`;
}

export function lovableScannerSearch(): string {
  return `${LOVABLE_ROUTES.scanner}/recherche`;
}

export function lovableWalletAccess(accessId: string): string {
  return `${LOVABLE_ROUTES.acces}/${accessId}`;
}

export function lovableWalletHistory(): string {
  return `${LOVABLE_ROUTES.acces}/historique`;
}

export function lovableWalletAnalytics(): string {
  return `${LOVABLE_ROUTES.acces}/analytics`;
}

export function lovableWalletSearch(): string {
  return `${LOVABLE_ROUTES.acces}/recherche`;
}

export function lovableEventDesign(eventId: string): string {
  return `${LOVABLE_ROUTES.evenements}/${eventId}/design`;
}

export function lovableDesignDiversity(): string {
  return '/design/diversity';
}

export function lovableFinance(): string {
  return LOVABLE_ROUTES.finance;
}

export function lovableFinanceReports(): string {
  return `${LOVABLE_ROUTES.finance}/rapports`;
}

export function lovableEventInviterPricing(eventId: string): string {
  return `${LOVABLE_ROUTES.evenements}/${eventId}/inviter/tarifs`;
}
