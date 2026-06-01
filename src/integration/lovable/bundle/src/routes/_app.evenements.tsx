import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { ArrowUpRight } from "lucide-react";
import eventHero from "@/assets/event-hero.jpg";

export const Route = createFileRoute("/_app/evenements")({
  head: () => ({ meta: [{ title: "Mes événements — INVORA" }] }),
  component: Events,
});

const events = [
  { t: "Obsidian Gala", d: "24 DÉC · Paris", s: "Confirmé", n: "482 / 600" },
  { t: "Soirée Velours", d: "14 NOV · Marais", s: "Brouillon", n: "—" },
  { t: "Showcase 06", d: "06 DÉC · Pantin", s: "Confirmé", n: "212 / 300" },
  { t: "Brunch Privé", d: "28 NOV · Saint-Germain", s: "Privé", n: "40 / 40" },
];

function Events() {
  return (
    <div className="px-6 pt-12">
      <PageHeader
        eyebrow="Catalogue"
        title={
          <>
            Mes
            <br />
            <span className="font-serif italic">événements.</span>
          </>
        }
      />

      <div className="space-y-3">
        {events.map((e) => (
          <article
            key={e.t}
            className="flex items-center gap-4 p-3 pr-5 bg-surface border border-border rounded-2xl"
          >
            <div className="size-16 shrink-0 rounded-xl overflow-hidden relative">
              <img
                src={eventHero}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/30" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-medium truncate">{e.t}</h3>
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground mt-1 uppercase">
                {e.d}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 border border-border-strong rounded-full text-muted-foreground">
                  {e.s}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {e.n}
                </span>
              </div>
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground" />
          </article>
        ))}
      </div>
    </div>
  );
}
