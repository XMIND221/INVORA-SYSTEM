import type { EventUniverse } from '@/types/event';

/** Collections internes — jamais exposées à l’utilisateur. */
export type DesignCollectionId =
  | 'editorial'
  | 'luxe'
  | 'avant_garde'
  | 'nocturne'
  | 'heritage'
  | 'corporate'
  | 'festival'
  | 'signature_invora';

export type DesignAssetKind =
  | 'invitation'
  | 'ticket'
  | 'vip_pass'
  | 'qr_card'
  | 'story_vertical'
  | 'story_whatsapp'
  | 'story_instagram'
  | 'poster_square'
  | 'poster_portrait'
  | 'wallet_pass'
  | 'media_kit'
  | 'banner'
  | 'partner_visual';

export type DesignToneAxis =
  | 'elegant'
  | 'modern'
  | 'premium'
  | 'festive'
  | 'corporate'
  | 'exclusive';

export type VisualProfileAxis =
  | 'elegance'
  | 'energy'
  | 'prestige'
  | 'intimacy'
  | 'corporate'
  | 'festive'
  | 'nocturnal'
  | 'cultural'
  | 'premium';

export interface DesignEventInput {
  eventId: string;
  title: string;
  description: string;
  coverImageUrl?: string;
  dateLabel: string;
  location: string;
  category: string;
  subCategory?: string;
  universe: EventUniverse;
}

export interface DesignToneAdjustments {
  elegant: number;
  modern: number;
  premium: number;
  festive: number;
  corporate: number;
  exclusive: number;
}

export interface VisualProfile {
  axes: Record<VisualProfileAxis, number>;
  dominant: VisualProfileAxis[];
  moodLabel: string;
}

export interface PhotoTreatment {
  overlayOpacity: number;
  contrastBoost: number;
  gradientAngle: number;
  gradientStops: string[];
  textSafeZone: 'bottom' | 'center' | 'top';
  vignette: number;
}

export interface CompositionSpec {
  grid: 'editorial' | 'centered' | 'asymmetric' | 'split';
  spacingScale: number;
  ornamentLevel: number;
  frameStyle: 'minimal' | 'double' | 'arch' | 'none';
  titleZone: 'upper' | 'lower' | 'split';
  infoZone: 'footer' | 'sidebar' | 'inline';
  qrZone: 'corner' | 'embedded' | 'footer';
  effects: string[];
}

export interface InvoraDesignIdentity {
  fingerprint: string;
  collectionId: DesignCollectionId;
  collectionLabel: string;
  visualProfile: VisualProfile;
  composition: CompositionSpec;
  photo: PhotoTreatment;
  palette: {
    background: string;
    surface: string;
    accent: string;
    text: string;
    muted: string;
  };
  typography: {
    display: string;
    body: string;
    scale: number;
  };
  signature: string;
  generatedAt: string;
}

export interface GeneratedDesignAsset {
  kind: DesignAssetKind;
  label: string;
  format: string;
  description: string;
  previewStyle: Record<string, string>;
}

export interface DesignPackage {
  identity: InvoraDesignIdentity;
  assets: GeneratedDesignAsset[];
  mediaKitKeys: string[];
  rayonnerPhases: ('avant' | 'pendant' | 'apres')[];
}

export interface DesignDiversityReport {
  total: number;
  uniqueFingerprints: number;
  passed: boolean;
  samples: { title: string; fingerprint: string; collectionId: DesignCollectionId }[];
}
