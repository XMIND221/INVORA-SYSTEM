import type { EventStatus } from '@/types/event';
import {
  toUniversalStatus,
  UNIVERSAL_STATUS_LABEL,
  UNIVERSAL_STATUS_STYLE,
} from '@/integration/lovable/event-status';

interface EventStatusBadgeProps {
  status: EventStatus;
  size?: 'sm' | 'md';
}

export function EventStatusBadge({ status, size = 'sm' }: EventStatusBadgeProps) {
  const universal = toUniversalStatus(status);
  const label = UNIVERSAL_STATUS_LABEL[universal];
  const style = UNIVERSAL_STATUS_STYLE[universal];
  const pad = size === 'md' ? 'px-3 py-1' : 'px-2 py-0.5';
  const text = size === 'md' ? 'text-[10px]' : 'text-[9px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 uppercase tracking-[0.2em] border rounded-full ${pad} ${text} ${style.border} ${style.text}`}
    >
      <span className={`size-1.5 rounded-full ${style.dot}`} aria-hidden />
      {label}
    </span>
  );
}
