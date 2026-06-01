import { composeEventIdentity } from '@/features/engines/design.engine';
import type { DesignDiversityReport, DesignEventInput } from '@/types/design';

const WEDDING_TITLES = [
  'Mariage Fatou & Omar',
  'Union Aïcha',
  'Noces des Palmiers',
  'Wedding Riviera',
  'Cérémonie K.offi',
  'Mariage en Blanc',
  'Union Sacrée',
  'Noces d\'Or',
  'Mariage Atlas',
  'Fatou Forever',
];

const GALA_TITLES = [
  'Obsidian Gala',
  'Gala de la Fondation',
  'Charity Night Paris',
  'Black Tie Édition',
  'Gala Lumière',
  'Soirée Prestige',
  'Gala Opéra',
  'Crystal Evening',
  'Gala Noir & Or',
  'Midnight Gala',
];

const FESTIVAL_TITLES = [
  'Festival Horizon',
  'Live Pantin',
  'Scène Ouverte',
  'Sunset Festival',
  'Bass Culture',
  'Festival des Arts',
  'Soundwave',
  'Été Sonore',
  'Festival Lagon',
  'Stage One',
];

const CONFERENCE_TITLES = [
  'Summit Africa Tech',
  'Forum Innovation',
  'Conférence Leaders',
  'Business Day Dakar',
  'Corporate Forum',
  'Future Work Summit',
  'Impact Conference',
  'Executive Meet',
  'Digital Summit',
  'Policy Forum',
];

const VIP_TITLES = [
  'Soirée VIP Obsidian',
  'Club Privé 221',
  'Exclusive Night',
  'VIP Lounge Experience',
  'After Hours Elite',
  'Private Circle',
  'Rooftop VIP',
  'Members Only',
  'Secret Soirée',
  'VIP Backstage',
];

function batch(
  titles: string[],
  category: string,
  universe: 'inviter' | 'vendre',
): DesignEventInput[] {
  return titles.map((title, i) => ({
    eventId: `${category}-${i}-${title.length}`,
    title,
    description: `Expérience ${category} — ${title}`,
    dateLabel: `${10 + i} JAN`,
    location: 'Dakar, SN',
    category,
    universe,
  }));
}

export function runDesignDiversityChecks(): DesignDiversityReport {
  const inputs: DesignEventInput[] = [
    ...batch(WEDDING_TITLES, 'wedding', 'inviter'),
    ...batch(GALA_TITLES, 'gala', 'inviter'),
    ...batch(FESTIVAL_TITLES, 'festival', 'vendre'),
    ...batch(CONFERENCE_TITLES, 'conference', 'vendre'),
    ...batch(VIP_TITLES, 'vip', 'inviter'),
  ];

  const fingerprints = new Set<string>();
  const samples: DesignDiversityReport['samples'] = [];

  for (const input of inputs) {
    const identity = composeEventIdentity(input);
    fingerprints.add(identity.fingerprint);
    samples.push({
      title: input.title,
      fingerprint: identity.fingerprint.slice(0, 32),
      collectionId: identity.collectionId,
    });
  }

  const total = inputs.length;
  const uniqueFingerprints = fingerprints.size;
  const passed = uniqueFingerprints === total;

  return { total, uniqueFingerprints, passed, samples };
}
