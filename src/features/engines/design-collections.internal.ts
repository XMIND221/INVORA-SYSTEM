/**
 * Collections design INVORA — usage moteur uniquement.
 * NE PAS importer dans des composants UI orientés utilisateur.
 */
import type { DesignCollectionId } from '@/types/design';

export interface InternalDesignCollection {
  id: DesignCollectionId;
  /** Usage interne / logs — jamais affiché */
  engineKey: string;
  weight: number;
  keywords: string[];
  paletteBase: { hue: number; chroma: number; lightness: number };
  typography: { display: string; body: string };
  gridBias: 'editorial' | 'centered' | 'asymmetric' | 'split';
}

export const INTERNAL_DESIGN_COLLECTIONS: InternalDesignCollection[] = [
  {
    id: 'editorial',
    engineKey: 'col-editorial',
    weight: 1,
    keywords: ['gala', 'vernissage', 'exposition', 'culture'],
    paletteBase: { hue: 280, chroma: 0.04, lightness: 0.14 },
    typography: { display: 'Instrument Serif', body: 'Inter' },
    gridBias: 'editorial',
  },
  {
    id: 'luxe',
    engineKey: 'col-luxe',
    weight: 1.1,
    keywords: ['vip', 'privé', 'soirée', 'black tie', 'mariage'],
    paletteBase: { hue: 45, chroma: 0.08, lightness: 0.12 },
    typography: { display: 'Playfair Display', body: 'Inter' },
    gridBias: 'centered',
  },
  {
    id: 'avant_garde',
    engineKey: 'col-avant',
    weight: 0.9,
    keywords: ['club', 'underground', 'art', 'avant'],
    paletteBase: { hue: 330, chroma: 0.12, lightness: 0.1 },
    typography: { display: 'Space Grotesk', body: 'Inter' },
    gridBias: 'asymmetric',
  },
  {
    id: 'nocturne',
    engineKey: 'col-nocturne',
    weight: 1,
    keywords: ['nuit', 'after', 'obsidian', 'noir'],
    paletteBase: { hue: 260, chroma: 0.06, lightness: 0.08 },
    typography: { display: 'Cormorant Garamond', body: 'Inter' },
    gridBias: 'split',
  },
  {
    id: 'heritage',
    engineKey: 'col-heritage',
    weight: 1,
    keywords: ['tradition', 'famille', 'heritage', 'classique'],
    paletteBase: { hue: 30, chroma: 0.05, lightness: 0.16 },
    typography: { display: 'Libre Baskerville', body: 'Inter' },
    gridBias: 'editorial',
  },
  {
    id: 'corporate',
    engineKey: 'col-corp',
    weight: 1,
    keywords: ['conférence', 'summit', 'business', 'corporate', 'forum'],
    paletteBase: { hue: 220, chroma: 0.04, lightness: 0.18 },
    typography: { display: 'Inter', body: 'Inter' },
    gridBias: 'split',
  },
  {
    id: 'festival',
    engineKey: 'col-festival',
    weight: 1.15,
    keywords: ['festival', 'concert', 'scène', 'live'],
    paletteBase: { hue: 145, chroma: 0.14, lightness: 0.14 },
    typography: { display: 'Archivo Black', body: 'Inter' },
    gridBias: 'asymmetric',
  },
  {
    id: 'signature_invora',
    engineKey: 'col-invora',
    weight: 0.85,
    keywords: ['invora', 'expérience', 'signature'],
    paletteBase: { hue: 0, chroma: 0.02, lightness: 0.11 },
    typography: { display: 'Instrument Serif', body: 'Inter' },
    gridBias: 'editorial',
  },
];

export function pickCollectionBySeed(
  seed: number,
  category: string,
): InternalDesignCollection {
  const cat = category.toLowerCase();
  const scored = INTERNAL_DESIGN_COLLECTIONS.map((c) => {
    const kw = c.keywords.some((k) => cat.includes(k) || cat.includes(k.slice(0, 4)));
    const bias = kw ? 2 : 0;
    return { c, score: c.weight + bias + (seed % 7) * 0.01 };
  });
  scored.sort((a, b) => b.score - a.score);
  const idx = seed % scored.length;
  const pivot = (seed >> 3) % scored.length;
  return scored[(idx + pivot) % scored.length]!.c;
}
