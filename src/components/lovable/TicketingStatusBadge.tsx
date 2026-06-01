import type { TicketingStatus } from '@/types/vendre';
import { TICKETING_STATUS_LABEL } from '@/features/engines/vendre.engine';

const STYLE: Record<TicketingStatus, string> = {
  draft: 'border-border text-muted-foreground',
  published: 'border-border-strong text-foreground',
  on_sale: 'border-success/40 text-foreground',
  sold_out: 'border-destructive/30 text-destructive',
  ended: 'border-border text-muted-foreground',
  archived: 'border-border text-muted-foreground',
};

export function TicketingStatusBadge({ status }: { status: TicketingStatus }) {
  return (
    <span
      className={`text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 border rounded-full ${STYLE[status]}`}
    >
      {TICKETING_STATUS_LABEL[status]}
    </span>
  );
}
