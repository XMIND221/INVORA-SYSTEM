import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles, Ticket, Coins, ScanLine } from "lucide-react";
import { setStoredRole, type Role } from "@/lib/use-role";
import welcomeBg from "@/assets/welcome-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "INVORA — Système de gestion d'expériences" },
      {
        name: "description",
        content:
          "INVORA conçoit, diffuse et gère vos événements premium — invitations, billetterie, accès et analytics dans un seul système.",
      },
      { property: "og:title", content: "INVORA — Système d'expériences premium" },
      {
        property: "og:description",
        content: "Quatre rôles, un seul système. Créez, vendez, accédez, scannez.",
      },
    ],
  }),
  component: Welcome,
});

const roles: { id: Role; label: string; tagline: string; icon: typeof Sparkles }[] = [
  {
    id: "organisateur",
    label: "Organisateur",
    tagline: "Créer & orchestrer vos événements",
    icon: Sparkles,
  },
  {
    id: "participant",
    label: "Participant",
    tagline: "Vos accès, billets & invitations",
    icon: Ticket,
  },
  {
    id: "partenaire",
    label: "Partenaire",
    tagline: "Commissions & distribution",
    icon: Coins,
  },
  {
    id: "scanner",
    label: "Scanner",
    tagline: "Validation des accès",
    icon: ScanLine,
  },
];

function Welcome() {
  const navigate = useNavigate();

  const choose = (role: Role) => {
    setStoredRole(role);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("invora:role"));
    }
    navigate({ to: "/accueil" });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Atmosphere */}
      <div className="absolute inset-0 -z-10">
        <img
          src={welcomeBg}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          width={832}
          height={1280}
        />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[140%] h-[60vh] rounded-full bg-white/[0.04] blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="mx-auto max-w-md min-h-screen px-6 pt-14 pb-10 flex flex-col">
        {/* Wordmark */}
        <div className="flex items-center justify-between">
          <span className="font-serif italic text-2xl tracking-tight">Invora</span>
          <span className="eyebrow">v.1 · 2026</span>
        </div>

        {/* Headline */}
        <div className="mt-20">
          <div className="eyebrow mb-5">Invora System</div>
          <h1 className="text-[44px] leading-[1.02] font-light tracking-tight">
            Définissez votre
            <br />
            <span className="font-serif italic">expérience.</span>
          </h1>
          <p className="mt-5 text-sm text-muted-foreground max-w-xs">
            Un seul système, quatre univers. Choisissez le vôtre pour entrer.
          </p>
        </div>

        {/* Roles */}
        <div className="mt-12 space-y-3">
          {roles.map(({ id, label, tagline, icon: Icon }) => (
            <button
              key={id}
              onClick={() => choose(id)}
              className="group w-full p-5 bg-surface/70 backdrop-blur-sm border border-border rounded-2xl flex items-center justify-between text-left transition-all duration-500 hover:border-border-strong hover:bg-surface"
            >
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl border border-border bg-surface-2 flex items-center justify-center">
                  <Icon className="size-4 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="text-base font-medium">{label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{tagline}</div>
                </div>
              </div>
              <div className="size-8 rounded-full border border-border flex items-center justify-center transition-colors group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
                <ArrowUpRight className="size-3.5" strokeWidth={2} />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-auto pt-10 text-center">
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Système d'expériences automatisé
          </p>
        </div>
      </div>
    </main>
  );
}
