import type { InviterAccessStatus } from '@/types/inviter';
import { INVITER_STATUS_LABEL } from '@/features/engines/inviter.engine';

const STYLE: Record<InviterAccessStatus, string> = {
  created: 'border-border text-muted-foreground',
  distributed: 'border-border-strong text-foreground',
  opened: 'border-border-strong text-foreground',
  claimed: 'border-success/40 text-foreground',
  scanned: 'bg-foreground/10 border-foreground text-foreground',
  expired: 'border-border text-muted-foreground',
  cancelled: 'border-destructive/30 text-destructive',
};

export function InviterStatusBadge({ status }: { status: InviterAccessStatus }) {
  return (
    <span
      className={`text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 border rounded-full ${STYLE[status]}`}
    >
      {INVITER_STATUS_LABEL[status]}
    </span>
  );
}
