import { pickCollectionBySeed } from '@/features/engines/design-collections.internal';
import {
  buildVisualProfile,
  DEFAULT_TONE_ADJUSTMENTS,
  detectEventCategory,
  hashDesignSeed,
} from '@/features/engines/design-analysis.engine';
import { composeLayout, compositionToPreviewVars } from '@/features/engines/design-composition.engine';
import { composePhotoTreatment, photoTreatmentToCss } from '@/features/engines/design-photo.engine';
import { generateSupportAssets } from '@/features/engines/design-supports.engine';
import type {
  DesignEventInput,
  DesignPackage,
  DesignToneAdjustments,
  InvoraDesignIdentity,
} from '@/types/design';
import type { EventUniverse } from '@/types/event';

export { DEFAULT_TONE_ADJUSTMENTS } from '@/features/engines/design-analysis.engine';

/** @deprecated Utiliser generateDesignPackage */
export function getDesignDeliverables(universe: EventUniverse) {
  const pkg = generateDesignPackage({
    eventId: 'preview',
    title: 'Preview',
    description: '',
    dateLabel: '',
    location: '',
    category: universe === 'inviter' ? 'gala' : 'festival',
    universe,
  });
  return pkg.assets.slice(0, 5).map((a) => ({
    kind: a.kind as 'invitation' | 'ticket' | 'story' | 'poster' | 'badge' | 'wallet_pass',
    label: a.label,
    description: a.description,
  }));
}

export function composeEventIdentity(
  input: DesignEventInput,
  tone: DesignToneAdjustments = DEFAULT_TONE_ADJUSTMENTS,
): InvoraDesignIdentity {
  const category = detectEventCategory(input);
  const seed = hashDesignSeed([
    input.eventId,
    input.title,
    input.description,
    input.dateLabel,
    input.location,
    category,
    input.subCategory ?? '',
    input.universe,
    input.coverImageUrl ?? '',
    String(tone.elegant),
    String(tone.premium),
    String(tone.festive),
  ]);

  const collection = pickCollectionBySeed(seed, category);
  const visualProfile = buildVisualProfile(input, seed, tone);
  const composition = composeLayout(seed, collection, tone);
  const photo = composePhotoTreatment(seed, collection, visualProfile, composition);

  const hue = collection.paletteBase.hue + (seed % 18) - 9;
  const accentShift = (seed % 30) - 15;
  const palette = {
    background: `oklch(${collection.paletteBase.lightness} ${collection.paletteBase.chroma} ${hue})`,
    surface: `oklch(${collection.paletteBase.lightness + 0.06} ${collection.paletteBase.chroma * 0.7} ${hue + 8})`,
    accent: `oklch(0.72 0.12 ${hue + accentShift})`,
    text: `oklch(0.96 0.01 ${hue})`,
    muted: `oklch(0.65 0.02 ${hue})`,
  };

  const fingerprint = [
    collection.id,
    palette.accent,
    composition.grid,
    String(composition.ornamentLevel),
    String(photo.overlayOpacity),
    composition.frameStyle,
    photo.textSafeZone,
    String(visualProfile.dominant.join('-')),
  ].join('::');

  return {
    fingerprint,
    collectionId: collection.id,
    collectionLabel: collection.engineKey,
    visualProfile,
    composition,
    photo,
    palette,
    typography: {
      display: collection.typography.display,
      body: collection.typography.body,
      scale: 1 + (seed % 7) * 0.02,
    },
    signature: `INVORA·${input.eventId.slice(0, 8)}·${seed.toString(36)}`,
    generatedAt: new Date().toISOString(),
  };
}

export function generateDesignPackage(
  input: DesignEventInput,
  tone?: DesignToneAdjustments,
): DesignPackage {
  const identity = composeEventIdentity(input, tone);
  const assets = generateSupportAssets(input, identity);

  return {
    identity,
    assets,
    mediaKitKeys: [
      'story_ig',
      'story_wa',
      'poster_square',
      'poster_vertical',
      'banner',
      'copy',
      'qr',
      'link',
    ],
    rayonnerPhases: ['avant', 'pendant', 'apres'],
  };
}

export function identityToCssVars(identity: InvoraDesignIdentity): Record<string, string> {
  return {
    ...identity.palette,
    ...compositionToPreviewVars(identity.composition),
    ...photoTreatmentToCss(identity.photo),
    fontFamily: identity.typography.display,
  };
}

export function applyTonePreset(
  base: DesignToneAdjustments,
  axis: keyof DesignToneAdjustments,
  delta: number,
): DesignToneAdjustments {
  return {
    ...base,
    [axis]: Math.min(1, Math.max(0, base[axis] + delta)),
  };
}
