import { useNotificationPreferences, useSaveNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { NOTIFICATION_KIND_LABELS } from '@/types/notifications';
import type { NotificationPreferences } from '@/types/notifications';

const PREFS_UI: { key: keyof NotificationPreferences; label: string }[] = [
  { key: 'emailEnabled', label: 'Email' },
  { key: 'whatsappEnabled', label: 'WhatsApp' },
  { key: 'inAppEnabled', label: 'In-App' },
  { key: 'pushEnabled', label: 'Push (bientôt)' },
];

const KIND_TOGGLES = ['event_reminder', 'access_used', 'payment_confirmed'] as const;

export function WalletNotificationPrepList() {
  const { data: prefs, isLoading } = useNotificationPreferences();
  const save = useSaveNotificationPreferences();

  if (isLoading || !prefs) {
    return <p className="text-sm text-muted-foreground py-4">Chargement des préférences…</p>;
  }

  const toggleChannel = (key: keyof NotificationPreferences) => {
    if (typeof prefs[key] !== 'boolean') return;
    void save.mutateAsync({ [key]: !prefs[key] });
  };

  const toggleKind = (kind: string) => {
    const disabled = new Set(prefs.disabledKinds);
    if (disabled.has(kind)) disabled.delete(kind);
    else disabled.add(kind);
    void save.mutateAsync({ disabledKinds: [...disabled] });
  };

  return (
    <div className="space-y-4 mt-4">
      <ul className="space-y-2">
        {PREFS_UI.map(({ key, label }) => (
          <li
            key={key}
            className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl text-sm"
          >
            <span>{label}</span>
            <button
              type="button"
              onClick={() => toggleChannel(key)}
              disabled={save.isPending}
              className={`text-[10px] uppercase tracking-[0.16em] ${
                prefs[key] ? 'text-[color:var(--color-success)]' : 'text-muted-foreground'
              }`}
            >
              {prefs[key] ? 'Activé' : 'Off'}
            </button>
          </li>
        ))}
      </ul>
      <p className="eyebrow">Types de messages</p>
      <ul className="space-y-2">
        {KIND_TOGGLES.map((kind) => {
          const enabled = !prefs.disabledKinds.includes(kind);
          return (
            <li
              key={kind}
              className="flex items-center justify-between p-3 bg-surface border border-border rounded-xl text-sm"
            >
              <span>{NOTIFICATION_KIND_LABELS[kind] ?? kind}</span>
              <button
                type="button"
                onClick={() => toggleKind(kind)}
                disabled={save.isPending}
                className={`text-[10px] uppercase tracking-[0.16em] ${
                  enabled ? 'text-[color:var(--color-success)]' : 'text-muted-foreground'
                }`}
              >
                {enabled ? 'Activé' : 'Off'}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
