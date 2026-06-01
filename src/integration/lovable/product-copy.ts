import type { EventUniverse } from '@/types/event';

export const ROLE_INTENT = {
  organisateur: {
    label: 'Organisateur',
    verb: 'Créer et gérer vos expériences',
    youAre: 'Vous créez et pilotez l’expérience',
    youGet: 'Invitations, billets, accès et contrôle — générés par INVORA',
    nextHint: 'Choisissez INVITER (privé) ou VENDRE (public)',
  },
  participant: {
    label: 'Invité',
    verb: 'Recevoir et utiliser vos accès',
    youAre: 'Vous êtes invité ou acheteur — pas un organisateur',
    youGet: 'Billets, invitations et QR dans votre portefeuille',
    nextHint: 'Ouvrez Mes accès et présentez votre QR',
  },
  partenaire: {
    label: 'Partenaire',
    verb: 'Promouvoir et gagner',
    youAre: 'Vous distribuez — vous ne créez pas l’événement',
    youGet: 'Liens, visuels et commissions sur un seul wallet',
    nextHint: 'Partagez vos liens et suivez vos gains',
  },
  scanner: {
    label: 'Scanner',
    verb: 'Contrôler les accès sur place',
    youAre: 'Vous validez les entrées à l’événement',
    youGet: 'Scan, validation, refus et historique en direct',
    nextHint: 'Lancez le scan à l’entrée',
  },
} as const;

export const UNIVERSE_COPY: Record<
  EventUniverse,
  { title: string; subtitle: string; badge: string; nature: string }
> = {
  inviter: {
    title: 'INVITER',
    subtitle: 'Accès privés — vous connaissez vos invités',
    badge: 'Privé',
    nature: 'Mariages, VIP, corporate, famille, presse, staff',
  },
  vendre: {
    title: 'VENDRE',
    subtitle: 'Billetterie publique — vous ne connaissez pas encore les acheteurs',
    badge: 'Public',
    nature: 'Concerts, festivals, conférences, culturel',
  },
};

export const INVITER_FLOW = [
  { key: 'creer', label: 'Créer accès' },
  { key: 'invites', label: 'Ajouter invités' },
  { key: 'distribuer', label: 'Distribuer' },
  { key: 'scanner', label: 'Scanner' },
  { key: 'analyser', label: 'Analyser' },
] as const;

export const VENDRE_FLOW = [
  { key: 'billets', label: 'Créer billets' },
  { key: 'publier', label: 'Publier' },
  { key: 'acheter', label: 'Acheter' },
  { key: 'payer', label: 'Payer' },
  { key: 'qr', label: 'Recevoir QR' },
  { key: 'scanner', label: 'Scanner' },
  { key: 'analyser', label: 'Analyser' },
] as const;

export const WALLET_COPY = {
  title: 'Mes accès',
  subtitle: 'Votre portefeuille INVORA',
  notARole: 'Ce n’est pas un rôle — c’est l’endroit où vivent vos billets et invitations',
  youGet: 'QR, cartes et historique — compte optionnel',
} as const;

export const PARTNER_FAQ = [
  {
    q: 'Comment gagner ?',
    a: 'Partagez votre lien unique. Chaque vente via ce lien vous rapporte une commission sur la marge INVORA.',
  },
  {
    q: 'Comment partager ?',
    a: 'Stories, WhatsApp, email — INVORA vous fournit affiches, visuels et textes prêts à publier.',
  },
  {
    q: 'Comment suivre ?',
    a: 'Clics, ventes et commissions en temps réel sur chaque événement.',
  },
  {
    q: 'Comment retirer ?',
    a: 'Un seul wallet pour INVITER et VENDRE. Retrait SEPA en 1 à 2 jours ouvrés.',
  },
] as const;

export const SCANNER_COPY = {
  scan: 'Scannez le QR à l’entrée',
  valid: 'Validé — accès autorisé',
  deny: 'Refusé — doublon ou pass invalide',
  history: 'Historique des derniers passages',
} as const;
