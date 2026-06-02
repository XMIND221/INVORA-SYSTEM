import { useEffect, useState } from 'react';
import { renderQrDataUrl } from '@/features/engines/qr.engine';
import { Skeleton } from '@/components/lovable/ui-states';

interface TicketQrDisplayProps {
  payload: string;
  codeLabel: string;
  size?: number;
}

export function TicketQrDisplay({ payload, codeLabel, size = 160 }: TicketQrDisplayProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void renderQrDataUrl(payload).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  return (
    <div className="p-3 bg-white rounded-2xl flex flex-col items-center">
      {src ? (
        <img src={src} alt="QR billet" width={size} height={size} className="rounded-lg" />
      ) : (
        <Skeleton className="rounded-lg" />
      )}
      <p className="font-mono text-[10px] tracking-[0.3em] mt-4 text-foreground">{codeLabel}</p>
    </div>
  );
}
