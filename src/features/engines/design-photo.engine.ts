import type { CompositionSpec, PhotoTreatment, VisualProfile } from '@/types/design';
import type { InternalDesignCollection } from '@/features/engines/design-collections.internal';

export function composePhotoTreatment(
  seed: number,
  collection: InternalDesignCollection,
  profile: VisualProfile,
  composition: CompositionSpec,
): PhotoTreatment {
  const prestige = profile.axes.prestige;
  const energy = profile.axes.energy;
  const overlay = 0.35 + prestige * 0.25 + (seed % 11) * 0.008;
  const contrast = 1.05 + prestige * 0.2 + energy * 0.1;
  const angle = (seed % 360) + collection.paletteBase.hue;

  const h = collection.paletteBase.hue;
  const gradientStops = [
    `oklch(0.08 ${collection.paletteBase.chroma} ${h} / 0.85)`,
    `oklch(0.14 ${collection.paletteBase.chroma * 0.6} ${h + 20} / 0.55)`,
    `oklch(0.22 ${collection.paletteBase.chroma * 0.3} ${h + 40} / 0.2)`,
  ];

  const zones: PhotoTreatment['textSafeZone'][] = ['bottom', 'center', 'top'];
  const textSafeZone = zones[(seed + composition.grid.length) % zones.length]!;

  return {
    overlayOpacity: Math.min(0.78, overlay),
    contrastBoost: Math.min(1.45, contrast),
    gradientAngle: angle % 360,
    gradientStops,
    textSafeZone,
    vignette: 0.15 + (seed % 20) / 100,
  };
}

export function photoTreatmentToCss(photo: PhotoTreatment): Record<string, string> {
  return {
    backgroundImage: `linear-gradient(${photo.gradientAngle}deg, ${photo.gradientStops.join(', ')})`,
    boxShadow: `inset 0 0 ${80 + photo.vignette * 120}px oklch(0 0 0 / ${photo.vignette})`,
  };
}
