import type { PartnerMediaAsset } from '@/types/partner';
import type { EventUniverse } from '@/types/event';

/**
 * Media Kit Engine — assets auto pour partenaires (RAYONNER / diffusion).
 */
export function getPartnerMediaKitAssets(
  eventTitle: string,
  universe: EventUniverse,
  shareLink: string,
): PartnerMediaAsset[] {
  const promo = universe === 'inviter' ? 'Accès privés' : 'Billetterie ouverte';

  return [
    { key: 'story_ig', label: 'Story Instagram', description: `9:16 · ${eventTitle}`, format: '9:16' },
    { key: 'story_wa', label: 'Story WhatsApp', description: `Statut · ${promo}`, format: '9:16' },
    { key: 'poster_square', label: 'Affiche carrée', description: 'Feed & réseaux', format: '1:1' },
    { key: 'poster_vertical', label: 'Affiche verticale', description: 'Stories & print', format: '4:5' },
    { key: 'banner', label: 'Bannière', description: 'Header web & email', format: '16:9' },
    {
      key: 'copy',
      label: 'Texte promotionnel',
      description: `Découvrez ${eventTitle} — ${promo}. ${shareLink}`,
    },
    { key: 'qr', label: 'QR promotionnel', description: 'Lien traçable partenaire', format: 'QR' },
    { key: 'link', label: 'Lien partenaire', description: shareLink },
  ];
}

export function buildPromoShareText(eventTitle: string, link: string, universe: EventUniverse): string {
  const hook = universe === 'inviter' ? 'Accès exclusif' : 'Billets disponibles';
  return `${hook} — ${eventTitle}\n${link}\n#INVORA`;
}
