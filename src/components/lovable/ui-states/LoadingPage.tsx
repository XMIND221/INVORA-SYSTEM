import { Loader2 } from 'lucide-react';

export function LoadingPage({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-8 animate-spin" strokeWidth={1.5} />
      <p className="text-sm">{label}</p>
    </div>
  );
}
