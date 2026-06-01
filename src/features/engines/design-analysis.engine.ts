import type { DesignEventInput, DesignToneAdjustments, VisualProfile, VisualProfileAxis } from '@/types/design';

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  wedding: ['mariage', 'wedding', 'noces', 'union'],
  gala: ['gala', 'bal', 'charity', 'fondation'],
  festival: ['festival', 'concert', 'live', 'scène'],
  conference: ['conférence', 'summit', 'forum', 'congress'],
  vip: ['vip', 'privé', 'exclusive', 'soirée'],
};

export function detectEventCategory(input: DesignEventInput): string {
  const blob = `${input.title} ${input.description} ${input.subCategory ?? ''}`.toLowerCase();
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some((w) => blob.includes(w))) return cat;
  }
  return input.universe === 'vendre' ? 'festival' : 'gala';
}

export function hashDesignSeed(parts: string[]): number {
  const raw = parts.join('|');
  let h = 5381;
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) + h) ^ raw.charCodeAt(i);
  }
  return Math.abs(h);
}

export function buildVisualProfile(
  input: DesignEventInput,
  seed: number,
  tone: DesignToneAdjustments,
): VisualProfile {
  const cat = detectEventCategory(input);
  const base: Record<VisualProfileAxis, number> = {
    elegance: 0.5,
    energy: 0.4,
    prestige: 0.5,
    intimacy: 0.3,
    corporate: 0.3,
    festive: 0.4,
    nocturnal: 0.35,
    cultural: 0.35,
    premium: 0.6,
  };

  if (cat === 'wedding') {
    base.elegance = 0.85;
    base.intimacy = 0.75;
    base.prestige = 0.7;
  } else if (cat === 'gala') {
    base.prestige = 0.9;
    base.nocturnal = 0.7;
    base.elegance = 0.8;
  } else if (cat === 'festival') {
    base.energy = 0.9;
    base.festive = 0.95;
    base.cultural = 0.6;
  } else if (cat === 'conference') {
    base.corporate = 0.9;
    base.premium = 0.75;
    base.elegance = 0.65;
  } else if (cat === 'vip') {
    base.prestige = 0.95;
    base.intimacy = 0.8;
    base.premium = 0.92;
  }

  if (input.universe === 'inviter') {
    base.intimacy += 0.1;
    base.prestige += 0.05;
  } else {
    base.energy += 0.1;
    base.festive += 0.05;
  }

  const jitter = (seed % 100) / 500;
  base.elegance = clamp01(base.elegance + tone.elegant * 0.08 + jitter);
  base.energy = clamp01(base.energy + tone.festive * 0.1 - tone.elegant * 0.03);
  base.prestige = clamp01(base.prestige + tone.premium * 0.1 + tone.exclusive * 0.05);
  base.corporate = clamp01(base.corporate + tone.corporate * 0.12);
  base.festive = clamp01(base.festive + tone.festive * 0.12);
  base.premium = clamp01(base.premium + tone.premium * 0.15);
  base.nocturnal = clamp01(base.nocturnal + (seed % 5) * 0.02);

  const sorted = (Object.entries(base) as [VisualProfileAxis, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);

  const moodLabel = moodFromDominant(sorted);

  return { axes: base, dominant: sorted, moodLabel };
}

function moodFromDominant(d: VisualProfileAxis[]): string {
  if (d.includes('festive') && d.includes('energy')) return 'Énergie maîtrisée';
  if (d.includes('prestige') && d.includes('elegance')) return 'Noir luxe éditorial';
  if (d.includes('corporate')) return 'Précision premium';
  if (d.includes('intimacy')) return 'Intimité cérémoniale';
  return 'Signature INVORA';
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export const DEFAULT_TONE_ADJUSTMENTS: DesignToneAdjustments = {
  elegant: 0.5,
  modern: 0.5,
  premium: 0.5,
  festive: 0.5,
  corporate: 0.5,
  exclusive: 0.5,
};