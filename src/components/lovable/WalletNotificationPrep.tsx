import { accessService } from '@/services/access.service';

export function WalletNotificationPrepList() {
  const items = accessService.notifications();
  return (
    <ul className="space-y-2 mt-4">
      {items.map((n) => (
        <li
          key={n.kind}
          className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl text-sm"
        >
          <span>{n.label}</span>
          <span
            className={`text-[10px] uppercase tracking-[0.16em] ${
              n.enabled ? 'text-[color:var(--color-success)]' : 'text-muted-foreground'
            }`}
          >
            {n.enabled ? 'Préparé' : 'Off'}
          </span>
        </li>
      ))}
    </ul>
  );
}
