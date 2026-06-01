import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Circle, ArrowRight, Image, Settings2, Send, Radio, BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_app/parcours")({
  head: () => ({ meta: [{ title: "Parcours événement — INVORA" }] }),
  component: Parcours,
});

type Step = {
  n: string;
  key: string;
  title: string;
  desc: string;
  status: "done" | "now" | "todo";
  icon: typeof Image;
  next?: string;
  to?: string;
};

const steps: Step[] = [
  {
    n: "01",
    key: "creer",
    title: "Créer",
    desc: "Une photo, un nom, une date. INVORA dessine l'univers.",
    status: "done",
    icon: Image,
    to: "/creer",
  },
  {
    n: "02",
    key: "configurer",
    title: "Configurer",
    desc: "Billetterie, invitations, quotas, accès partenaires.",
    status: "done",
    icon: Settings2,
  },
  {
    n: "03",
    key: "publier",
    title: "Publier",
    desc: "Envoyez invitations, ouvrez la billetterie, activez les liens partenaires.",
    status: "now",
    icon: Send,
    next: "Envoyer les 240 invitations en attente",
  },
  {
    n: "04",
    key: "gerer",
    title: "Gérer",
    desc: "Suivi temps réel, scans aux portes, gestion des présences.",
    status: "todo",
    icon: Radio,
  },
  {
    n: "05",
    key: "analyser",
    title: "Analyser",
    desc: "Revenus, taux de remplissage, partenaires, NPS soirée.",
    status: "todo",
    icon: BarChart3,
  },
];

function Parcours() {
  const current = steps.find((s) => s.status === "now");
  const progress = (steps.filter((s) => s.status === "done").length / steps.length) * 100;

  return (
    <div className="px-6 pt-12">
      <PageHeader
        eyebrow="Obsidian Gala · 24 DÉC"
        title={<>Votre<br /><span className="font-serif italic">parcours.</span></>}
        description="Chaque étape, une action claire. Rien à deviner."
      />

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="eyebrow">Avancement</span>
          <span className="font-mono text-[10px] text-muted-foreground">{Math.round(progress)}% · étape 3 / 5</span>
        </div>
        <div className="h-1 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-foreground transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Next action */}
      {current && (
        <div className="p-5 mb-10 rounded-2xl bg-primary text-primary-foreground">
          <p className="text-[10px] uppercase tracking-[0.25em] opacity-60 mb-2">Prochaine action</p>
          <p className="font-serif italic text-2xl leading-tight mb-1">{current.title}</p>
          <p className="text-xs opacity-70 mb-4">{current.next ?? current.desc}</p>
          <button className="w-full py-3 rounded-xl bg-primary-foreground/10 text-sm font-medium flex items-center justify-center gap-2">
            Continuer cette étape <ArrowRight className="size-4" />
          </button>
        </div>
      )}

      {/* Timeline */}
      <ol className="relative">
        <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />
        {steps.map((s) => {
          const Icon = s.icon;
          const done = s.status === "done";
          const now = s.status === "now";
          return (
            <li key={s.key} className="relative pl-14 pb-6 last:pb-0">
              <div
                className={`absolute left-0 top-0 size-10 rounded-full flex items-center justify-center border ${
                  done
                    ? "bg-foreground text-background border-foreground"
                    : now
                      ? "bg-surface text-foreground border-foreground"
                      : "bg-surface text-muted-foreground border-border"
                }`}
              >
                {done ? <Check className="size-4" strokeWidth={2.5} /> : <Icon className="size-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl border ${
                  now ? "bg-surface-2 border-border-strong" : "bg-surface border-border"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] tracking-widest text-muted-foreground">{s.n}</span>
                    <h3 className="text-base font-medium">{s.title}</h3>
                  </div>
                  <span
                    className={`text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${
                      done
                        ? "text-[color:var(--color-success)] border-[color:var(--color-success)]/40"
                        : now
                          ? "text-foreground border-border-strong"
                          : "text-muted-foreground border-border"
                    }`}
                  >
                    {done ? "Fait" : now ? "À faire" : "À venir"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
                {s.to && now && (
                  <Link to={s.to} className="mt-3 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-foreground">
                    Ouvrir <ArrowRight className="size-3" />
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-10 mb-6 text-center font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        Invora Workflow · Toujours une seule action à la fois
      </p>
    </div>
  );
}
