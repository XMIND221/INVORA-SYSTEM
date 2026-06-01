import { ArrowUpRight, Sparkles, Ticket, Coins, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { ROLE_INTENT } from '@/integration/lovable/product-copy';
import { setStoredRole, type LovableRole } from '@/integration/lovable/use-role';

const roles: {
  id: LovableRole;
  icon: typeof Sparkles;
}[] = [
  { id: 'organisateur', icon: Sparkles },
  { id: 'participant', icon: Ticket },
  { id: 'partenaire', icon: Coins },
  { id: 'scanner', icon: ScanLine },
];

export default function WelcomePage() {
  const navigate = useNavigate();

  const choose = (role: LovableRole) => {
    setStoredRole(role);
    navigate(LOVABLE_ROUTES.accueil);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 -z-10 opacity-60 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,oklch(0.2_0_0),transparent)]" />

      <div className="mx-auto max-w-md min-h-screen px-6 pt-14 pb-10 flex flex-col">
        <div className="flex items-center justify-between">
          <span className="font-serif italic text-2xl tracking-tight">Invora</span>
          <span className="eyebrow">Expériences</span>
        </div>

        <div className="mt-16">
          <div className="eyebrow mb-4">Qui êtes-vous ?</div>
          <h1 className="text-[40px] leading-[1.02] font-light tracking-tight">
            Choisissez votre
            <br />
            <span className="font-serif italic">espace.</span>
          </h1>
          <p className="mt-4 text-sm text-muted-foreground max-w-xs">
            Chaque espace a un objectif clair. Pas de tutoriel — tout est indiqué à l’écran.
          </p>
        </div>

        <div className="mt-10 space-y-3">
          {roles.map(({ id, icon: Icon }) => {
            const intent = ROLE_INTENT[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => choose(id)}
                className="group w-full p-4 bg-surface/70 border border-border rounded-2xl flex items-center justify-between text-left hover:border-border-strong transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 rounded-xl border border-border bg-surface-2 flex items-center justify-center shrink-0">
                    <Icon className="size-4 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-medium">{intent.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 truncate">{intent.verb}</div>
                  </div>
                </div>
                <ArrowUpRight className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
              </button>
            );
          })}
        </div>

        <p className="mt-auto pt-8 text-center text-[11px] text-muted-foreground">
          Mes accès = portefeuille invité, pas un rôle à choisir ici.
        </p>
      </div>
    </main>
  );
}
