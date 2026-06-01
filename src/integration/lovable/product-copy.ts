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
  { key: 'event', label: 'Créer événement' },
  { key: 'access', label: 'Créer accès' },
  { key: 'invites', label: 'Ajouter invités' },
  { key: 'distribuer', label: 'Distribuer' },
  { key: 'utiliser', label: 'Utiliser accès' },
  { key: 'scanner', label: 'Scanner' },
  { key: 'analyser', label: 'Analyser' },
] as const;

export const INVITER_ENGINE_COPY = {
  title: 'INVITER',
  subtitle: 'Système d’accès privés — pas une billetterie',
  noAccount: 'L’invité ouvre le lien, voit son QR, entre — sans compte obligatoire',
  withAccount: 'Avec compte INVORA, les accès apparaissent automatiquement dans le wallet',
  reconcile: 'Réconciliation par téléphone et email à la création de compte',
  security: 'Lien unique · QR unique · validation unique · historique complet',
} as const;

export const VENDRE_FLOW = [
  { key: 'event', label: 'Créer événement' },
  { key: 'billets', label: 'Créer billets' },
  { key: 'publier', label: 'Publier' },
  { key: 'acheter', label: 'Acheter' },
  { key: 'payer', label: 'Paiement' },
  { key: 'qr', label: 'Recevoir accès' },
  { key: 'scanner', label: 'Scanner' },
  { key: 'analyser', label: 'Analyser' },
] as const;

export const VENDRE_ENGINE_COPY = {
  title: 'VENDRE',
  subtitle: 'Billetterie publique — pas des accès privés INVITER',
  financeNote: 'Commissions calculées côté Supabase (RPC / Edge Functions) uniquement',
  buyerNoAccount: 'Achat sans compte — réception Email, WhatsApp ou lien sécurisé',
  buyerWithAccount: 'Avec compte, billets regroupés dans Mes accès',
  security: 'QR & accès valides uniquement si payment_status = paid',
} as const;

export const WALLET_COPY = {
  title: 'Mes accès',
  subtitle: 'Votre portefeuille INVORA',
  notARole: 'Ce n’est pas un rôle — c’est l’endroit où vivent vos billets et invitations',
  youGet: 'QR, cartes et historique — compte optionnel',
} as const;

export const WALLET_ENGINE_COPY = {
  hubDesc: 'INVITER · VENDRE · VIP · billets — tout converge ici.',
  noAccount: 'WhatsApp, email, lien sécurisé ou QR — sans compte obligatoire.',
  reconcile: 'Réconciliation auto · téléphone & email historiques',
  historyDesc: 'Date, événement, type, statut, validation scanner.',
  analyticsDesc: 'Accès actifs, utilisés, expirés, taux d’utilisation.',
  searchDesc: 'Nom, téléphone, email, code accès, événement.',
  passApple: 'Apple Wallet — pass .pkpass (préparé)',
  passGoogle: 'Google Wallet — save to phone (préparé)',
  passDownload: 'Pass téléchargeable PDF/PNG',
  detailInstructions: 'Instructions d’entrée',
} as const;

export const PARTNER_ENGINE_COPY = {
  title: 'Partenaire',
  subtitle: 'Vous distribuez l’audience — pas l’événement. Un compte, un wallet, un retrait.',
  organizerHint:
    'Les partenaires reçoivent liens traçables, QR et Media Kit auto. Commissions INVITER & VENDRE via RPC Supabase.',
  financeNote: 'Commissions prélevées sur la marge INVORA uniquement — jamais calculées dans React.',
  tracking: 'Partner ID · code partenaire · liens & QR traçables',
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

export const SCANNER_ENGINE_COPY = {
  scanHint: 'QR INVORA · code accès · < 2 s',
  recent: 'Derniers scans',
  historyDesc: 'Heure, porte, agent, résultat, motif — audit complet.',
  analyticsDesc: 'Validés, refusés, temps moyen, portes, pics d’entrée.',
  searchDesc: 'Nom, téléphone, email, code accès, n° billet.',
  noResults: 'Aucun accès trouvé.',
  offlineSync: 'Synchroniser la file hors ligne',
  teamRoles: 'Chef scanner · Agent · Superviseur',
} as const;

/** Parcours macro organisateur — visible sur tous les écrans orga. */
export const ORGANIZER_JOURNEY = [
  { key: 'creer', label: 'Créer' },
  { key: 'configurer', label: 'Configurer' },
  { key: 'publier', label: 'Publier' },
  { key: 'gerer', label: 'Gérer' },
  { key: 'analyser', label: 'Analyser' },
] as const;

export const STUDIO_STEP_COPY = [
  { step: 1, eyebrow: 'Étape 1 · L’essentiel', title: 'Informations', hint: 'Photo, nom, date, lieu, description' },
  { step: 2, eyebrow: 'Étape 2 · Univers', title: 'INVITER ou VENDRE', hint: 'Choisissez le type d’expérience' },
  { step: 3, eyebrow: 'Étape 3 · Configuration', title: 'Paramètres', hint: 'Visibilité et capacité' },
  { step: 4, eyebrow: 'Étape 4 · Prévisualisation', title: 'Design Engine', hint: 'INVORA prépare vos visuels' },
  { step: 5, eyebrow: 'Étape 5 · Publication', title: 'Publier', hint: 'Mettre en ligne l’expérience' },
] as const;

export const DESIGN_ENGINE_COPY = {
  title: 'INVORA Design Engine',
  subtitle: 'Vous construisez l’événement — INVORA prépare automatiquement vos supports.',
  footer: 'Contraste & lisibilité auto · pas de galerie à choisir',
} as const;

export const FINANCE_ENGINE_COPY = {
  rule: 'Aucun calcul financier dans React — RPC & Edge uniquement.',
  inviterTitle: 'Devis INVITER',
  inviterDesc: 'Prix unitaire par palier · total en temps réel · prochain palier.',
  vendreTitle: 'Avant publication',
  organizerDesc: 'Disponible, en attente, retiré — répartitions figées à la transaction.',
  partnerNote: 'Commissions partenaires prélevées sur la marge INVORA uniquement.',
  reportsDesc: 'Rapports organisateur, partenaire et INVORA — export CSV préparé.',
  immutable: 'Commissions figées — les anciennes opérations ne changent jamais.',
} as const;

export const LUXURY_DESIGN_COPY = {
  title: 'Luxury Design Engine',
  subtitle: 'Vous créez l’expérience — INVORA compose l’identité visuelle premium.',
  footer: 'Signature INVORA · jamais de template à choisir',
  noGallery: 'Pas de galerie · pas de Template 1/2/3 — composition automatique unique.',
  toneTitle: 'Affiner l’ambiance',
  toneHint: 'INVORA recalcule grille, photo et palette — sans changer de modèle.',
  diversityDesc: '10 mariages · 10 galas · 10 festivals · 10 conférences · 10 VIP.',
} as const;

export const RAYONNER_PHASES = [
  {
    key: 'avant',
    label: 'Avant',
    description: 'Teasing, invitations, partenaires — préparer l’écho',
    status: 'preview' as const,
  },
  {
    key: 'pendant',
    label: 'Pendant',
    description: 'Live, stories, scans — l’expérience en direct',
    status: 'preview' as const,
  },
  {
    key: 'apres',
    label: 'Après',
    description: 'Remerciements, stats, relances — prolonger l’impact',
    status: 'preview' as const,
  },
] as const;

export const PUBLICATION_BLOCKER_LABELS: Record<string, string> = {
  title_required: 'Nom de l’expérience requis',
  universe_required: 'Choisissez INVITER ou VENDRE',
  visibility_required: 'Définissez la visibilité',
  starts_at_required_for_public: 'Date requise pour une expérience publique',
};
