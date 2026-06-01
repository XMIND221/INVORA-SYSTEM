import { NavLink, useLocation } from 'react-router-dom';
import { NAV_BY_ROLE } from '@/integration/lovable/navigation';
import { useRole } from '@/integration/lovable/use-role';

export function BottomNav() {
  const { pathname } = useLocation();
  const role = useRole();
  const tabs = NAV_BY_ROLE[role];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 px-4"
      style={{
        background:
          'linear-gradient(to top, var(--color-background) 55%, color-mix(in oklab, var(--color-background) 80%, transparent) 80%, transparent)',
      }}
      aria-label="Navigation principale"
    >
      <div
        className={`mx-auto max-w-md flex items-center justify-around bg-surface/80 backdrop-blur-xl border border-border rounded-full h-16 px-2 ${
          tabs.length <= 3 ? 'max-w-xs' : ''
        }`}
      >
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = pathname === t.to || pathname.startsWith(`${t.to}?`);
          if (t.primary) {
            return (
              <NavLink
                key={t.to}
                to={t.to}
                aria-label={t.label}
                aria-current={active ? 'page' : undefined}
                className="-my-4 size-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_10px_30px_-10px_rgba(255,255,255,0.35)] ring-4 ring-background active:scale-95 transition"
              >
                <Icon className="size-5" strokeWidth={2} />
              </NavLink>
            );
          }
          return (
            <NavLink
              key={t.to}
              to={t.to}
              aria-current={active ? 'page' : undefined}
              className="flex flex-col items-center gap-0.5 flex-1 min-w-0 px-0.5 group"
            >
              <Icon
                className={`size-5 transition ${active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground/70'}`}
                strokeWidth={1.5}
              />
              <span
                className={`text-[8px] uppercase tracking-[0.14em] truncate max-w-full ${
                  active ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {t.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
