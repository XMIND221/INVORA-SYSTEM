import { Loader2 } from 'lucide-react';

export function LoadingButton({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <Loader2 className="size-4 animate-spin" />
      {children}
    </span>
  );
}
