import { Copy, Download, Mail, MessageCircle } from 'lucide-react';
import type { PartnerMediaAsset } from '@/types/partner';

interface MediaKitGridProps {
  assets: PartnerMediaAsset[];
  onCopyLink?: (text: string) => void;
  onCopyText?: (text: string) => void;
}

export function MediaKitGrid({ assets, onCopyLink, onCopyText }: MediaKitGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {assets.map((a) => (
        <article key={a.key} className="p-3 rounded-xl bg-surface border border-border">
          <div
            className="aspect-[4/3] rounded-lg mb-2 flex items-end p-2"
            style={{
              background: 'linear-gradient(145deg, oklch(0.2 0 0), oklch(0.12 0 0))',
            }}
          >
            <span className="text-[8px] uppercase tracking-widest text-muted-foreground">
              {a.format ?? 'asset'}
            </span>
          </div>
          <p className="text-sm font-medium">{a.label}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{a.description}</p>
          <div className="flex gap-2 mt-2">
            {a.key === 'link' && onCopyLink && (
              <button
                type="button"
                onClick={() => onCopyLink(a.description)}
                className="p-1.5 border border-border rounded-lg"
                aria-label="Copier lien"
              >
                <Copy className="size-3.5" />
              </button>
            )}
            {a.key === 'copy' && onCopyText && (
              <button
                type="button"
                onClick={() => onCopyText(a.description)}
                className="p-1.5 border border-border rounded-lg"
                aria-label="Copier texte"
              >
                <Copy className="size-3.5" />
              </button>
            )}
            <button type="button" className="p-1.5 border border-border rounded-lg" aria-label="Télécharger">
              <Download className="size-3.5" />
            </button>
          </div>
        </article>
      ))}
      <div className="col-span-2 grid grid-cols-2 gap-2 mt-1">
        <button
          type="button"
          className="py-3 border border-border rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.15em]"
        >
          <MessageCircle className="size-4" />
          WhatsApp
        </button>
        <button
          type="button"
          className="py-3 border border-border rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.15em]"
        >
          <Mail className="size-4" />
          Email
        </button>
      </div>
    </div>
  );
}
