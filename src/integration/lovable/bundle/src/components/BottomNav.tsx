import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Plus, Calendar, Ticket, ScanLine } from "lucide-react";

type Tab = {
  to: "/accueil" | "/evenements" | "/creer" | "/acces" | "/scanner";
  label: string;
  icon: typeof Home;
  primary?: boolean;
};

const tabs: Tab[] = [
  { to: "/accueil", label: "Accueil", icon: Home },
  { to: "/evenements", label: "Événements", icon: Calendar },
  { to: "/creer", label: "Créer", icon: Plus, primary: true },
  { to: "/acces", label: "Accès", icon: Ticket },
  { to: "/scanner", label: "Scanner", icon: ScanLine },
];

export function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 px-4"
      style={{
        background:
          "linear-gradient(to top, var(--color-background) 55%, color-mix(in oklab, var(--color-background) 80%, transparent) 80%, transparent)",
      }}
    >
      <div className="mx-auto max-w-md flex items-center justify-around bg-surface/80 backdrop-blur-xl border border-border rounded-full h-16 px-3">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = path === t.to;
          if (t.primary) {
            return (
              <Link
                key={t.to}
                to={t.to}
                aria-label={t.label}
                className="-my-4 size-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-[0_10px_30px_-10px_rgba(255,255,255,0.35)] ring-4 ring-background active:scale-95 transition"
              >
                <Icon className="size-5" strokeWidth={2} />
              </Link>
            );
          }
          return (
            <Link
              key={t.to}
              to={t.to}
              className="flex flex-col items-center gap-1 flex-1 group"
            >
              <Icon
                className={`size-5 transition ${active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground/70"}`}
                strokeWidth={1.5}
              />
              <span
                className={`text-[9px] uppercase tracking-[0.18em] ${active ? "text-foreground" : "text-muted-foreground"}`}
              >
                {t.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
