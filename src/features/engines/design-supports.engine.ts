import type { DesignAssetKind, DesignEventInput, GeneratedDesignAsset, InvoraDesignIdentity } from '@/types/design';

const ASSET_META: Record<
  DesignAssetKind,
  { label: string; format: string; description: string }
> = {
  invitation: { label: 'Invitation', format: 'A5', description: 'Carte privée — QR intégré' },
  ticket: { label: 'Billet', format: 'ISO', description: 'Typologie & code unique' },
  vip_pass: { label: 'Pass VIP', format: 'Card', description: 'Accès prestige' },
  qr_card: { label: 'QR Card', format: 'Square', description: 'Présentation rapide' },
  story_vertical: { label: 'Story verticale', format: '9:16', description: 'Réseaux & mobile' },
  story_whatsapp: { label: 'Story WhatsApp', format: '9:16', description: 'Statut & partage' },
  story_instagram: { label: 'Story Instagram', format: '9:16', description: 'Stories IG' },
  poster_square: { label: 'Affiche carrée', format: '1:1', description: 'Feed digital' },
  poster_portrait: { label: 'Affiche portrait', format: '4:5', description: 'Print & stories' },
  wallet_pass: { label: 'Wallet Pass', format: 'Pass', description: 'Apple & Google' },
  media_kit: { label: 'Media Kit', format: 'Bundle', description: 'Partenaires & RAYONNER' },
  banner: { label: 'Bannière', format: '16:9', description: 'Web & email' },
  partner_visual: { label: 'Visuel partenaire', format: 'Multi', description: 'Diffusion traçable' },
};

export function generateSupportAssets(
  input: DesignEventInput,
  identity: InvoraDesignIdentity,
): GeneratedDesignAsset[] {
  const base = input.universe === 'inviter' ? INVITER_ASSETS : VENDRE_ASSETS;
  const shared = SHARED_ASSETS;
  const kinds = [...new Set([...base, ...shared])];

  return kinds.map((kind, index) => {
    const meta = ASSET_META[kind];
    const variant = (identity.fingerprint.charCodeAt(index % identity.fingerprint.length) % 24) / 24;
    return {
      kind,
      label: meta.label,
      format: meta.format,
      description: meta.description,
      previewStyle: buildAssetPreviewStyle(identity, kind, variant),
    };
  });
}

const INVITER_ASSETS: DesignAssetKind[] = [
  'invitation',
  'vip_pass',
  'qr_card',
  'story_vertical',
  'story_whatsapp',
  'story_instagram',
  'poster_square',
  'poster_portrait',
  'wallet_pass',
  'media_kit',
  'banner',
  'partner_visual',
];

const VENDRE_ASSETS: DesignAssetKind[] = [
  'ticket',
  'qr_card',
  'story_vertical',
  'story_whatsapp',
  'story_instagram',
  'poster_square',
  'poster_portrait',
  'wallet_pass',
  'media_kit',
  'banner',
  'partner_visual',
];

const SHARED_ASSETS: DesignAssetKind[] = [];

function buildAssetPreviewStyle(
  identity: InvoraDesignIdentity,
  kind: DesignAssetKind,
  variant: number,
): Record<string, string> {
  const { palette, photo } = identity;
  const aspect =
    kind.includes('story') || kind === 'poster_portrait'
      ? '9/16'
      : kind === 'poster_square' || kind === 'qr_card'
        ? '1/1'
        : kind === 'banner'
          ? '16/9'
          : '4/5';

  return {
    aspectRatio: aspect,
    background: `linear-gradient(${photo.gradientAngle + variant * 12}deg, ${palette.background}, ${palette.surface})`,
    borderColor: palette.accent,
    color: palette.text,
  };
}
