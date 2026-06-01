import type { CompositionSpec, DesignToneAdjustments } from '@/types/design';
import type { InternalDesignCollection } from '@/features/engines/design-collections.internal';

export function composeLayout(
  seed: number,
  collection: InternalDesignCollection,
  tone: DesignToneAdjustments,
): CompositionSpec {
  const grids: CompositionSpec['grid'][] = [
    collection.gridBias,
    'editorial',
    'asymmetric',
    'centered',
    'split',
  ];
  const grid = grids[(seed + Math.floor(tone.modern * 3)) % grids.length]!;

  const frames: CompositionSpec['frameStyle'][] = ['minimal', 'double', 'arch', 'none'];
  const frameStyle = frames[(seed >> 2) % frames.length]!;

  const titleZones: CompositionSpec['titleZone'][] = ['upper', 'lower', 'split'];
  const titleZone = titleZones[(seed >> 4) % titleZones.length]!;

  const qrZones: CompositionSpec['qrZone'][] = ['corner', 'embedded', 'footer'];
  const qrZone = qrZones[(seed >> 6) % qrZones.length]!;

  const ornamentLevel = clamp(
    0.2 + (seed % 10) / 20 + tone.elegant * 0.25 + tone.exclusive * 0.15,
    0,
    1,
  );
  const spacingScale = 0.85 + (seed % 15) / 50 + tone.premium * 0.12;

  const effects: string[] = [];
  if (ornamentLevel > 0.5) effects.push('hairline-border');
  if (tone.modern > 0.6) effects.push('glass-blur');
  if (tone.festive > 0.65) effects.push('soft-glow');
  if (tone.corporate > 0.6) effects.push('grid-lines');

  return {
    grid,
    spacingScale,
    ornamentLevel,
    frameStyle,
    titleZone,
    infoZone: seed % 2 === 0 ? 'footer' : 'sidebar',
    qrZone,
    effects,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function compositionToPreviewVars(comp: CompositionSpec): Record<string, string> {
  return {
    '--design-spacing': String(comp.spacingScale),
    '--design-ornament': String(comp.ornamentLevel),
    borderWidth: comp.frameStyle === 'double' ? '2px' : comp.frameStyle === 'minimal' ? '1px' : '0',
  };
}
