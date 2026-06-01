/**
 * Point d'entrée unique pour brancher l'UI Lovable sur la fondation INVORA.
 * Phase 0 : réexport uniquement — pas de logique métier additionnelle.
 */
export { useAuth } from '@/hooks/useAuth';
export { usePermissions } from '@/hooks/usePermissions';
export { useEvent, useEventDraft } from '@/hooks/useEvent';
export * as eventsService from '@/services/events.service';
export * as walletService from '@/services/wallet.service';
export * as invitationsService from '@/services/invitations.service';
export * as ticketsService from '@/services/tickets.service';
export * as scansService from '@/services/scans.service';
export * as partnersService from '@/services/partners.service';
