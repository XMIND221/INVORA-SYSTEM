export const PRODUCT_VOCABULARY = {
  appName: 'INVORA',
  primarySections: {
    dashboard: 'Tableau de bord',
    experiences: 'Mes expériences',
    wallet: 'Wallet',
    settings: 'Paramètres',
  },
  experience: {
    singular: 'Expérience',
    plural: 'Expériences',
    hub: 'Centre de contrôle',
    analytics: 'Analytics expérience',
    diffusion: 'Diffusion',
    scanner: 'Scanner',
  },
  access: {
    wallet: 'Wallet',
    passes: 'Accès',
    ticket: 'Billet',
    invitation: 'Invitation',
  },
  creation: {
    studio: 'Studio',
    steps: {
      information: 'Informations',
      typeVisibility: 'Type + Visibilité',
      summary: 'Résumé',
    },
  },
} as const;

export type ProductVocabulary = typeof PRODUCT_VOCABULARY;
