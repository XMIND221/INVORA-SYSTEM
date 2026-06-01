import { generateDesignPackage } from '@/features/engines/design.engine';
import { getPartnerMediaKitAssets } from '@/features/engines/media-kit.engine';
import type { DesignEventInput, DesignPackage } from '@/types/design';
import type { PartnerMediaAsset } from '@/types/partner';
import type { EventUniverse } from '@/types/event';

/**
 * Media Kit unifié — identité design + assets partenaires + RAYONNER.
 */
export function generateLuxuryMediaKit(
  input: DesignEventInput,
  shareLink: string,
): { design: DesignPackage; partnerAssets: PartnerMediaAsset[] } {
  const design = generateDesignPackage(input);
  const partnerAssets = getPartnerMediaKitAssets(input.title, input.universe, shareLink).map(
    (asset) => ({
      ...asset,
      description: `${asset.description} · ${design.identity.signature}`,
    }),
  );
  return { design, partnerAssets };
}

export function rayonnerAssetsForPhase(
  universe: EventUniverse,
  phase: 'avant' | 'pendant' | 'apres',
): string[] {
  if (phase === 'avant') {
    return universe === 'inviter'
      ? ['poster_square', 'story_instagram', 'invitation']
      : ['poster_portrait', 'story_whatsapp', 'banner'];
  }
  if (phase === 'pendant') {
    return ['story_vertical', 'qr_card', 'partner_visual'];
  }
  return ['poster_square', 'media_kit', 'banner'];
}
