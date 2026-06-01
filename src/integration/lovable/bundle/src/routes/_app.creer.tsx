import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Calendar, MapPin, Tag, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EventCard } from "@/components/EventCard";

export const Route = createFileRoute("/_app/creer")({
  head: () => ({ meta: [{ title: "Créer un événement — INVORA" }] }),
  component: Creer,
});

function Creer() {
  const [name, setName] = useState("Obsidian Gala");
  const [date, setDate] = useState("24 DÉC");
  const [location, setLocation] = useState("Paris, FR");
  const [mode, setMode] = useState<"invitation" | "billetterie">("invitation");

  return (
    <div className="px-6 pt-12">
      <PageHeader
        eyebrow="Studio · Étape 1 / 4"
        title={
          <>
            Un événement,
            <br />
            <span className="font-serif italic">un univers.</span>
          </>
        }
        description="Renseignez l'essentiel. INVORA dessine le reste."
      />

      {/* Photo upload */}
      <button className="w-full aspect-[16/9] mb-6 rounded-2xl border border-dashed border-border-strong bg-surface flex flex-col items-center justify-center gap-3 hover:bg-surface-2 transition">
        <Camera className="size-5 text-muted-foreground" strokeWidth={1.5} />
        <span className="text-xs text-muted-foreground">Ajouter une photo</span>
      </button>

      {/* Form */}
      <div className="space-y-3 mb-8">
        <Field icon={<Tag className="size-4" />} label="Nom">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground"
          />
        </Field>
        <Field icon={<Calendar className="size-4" />} label="Date">
          <input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent text-base font-medium outline-none"
          />
        </Field>
        <Field icon={<MapPin className="size-4" />} label="Lieu">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full bg-transparent text-base font-medium outline-none"
          />
        </Field>
      </div>

      {/* Mode toggle */}
      <div className="mb-8">
        <p className="eyebrow mb-3">Mode</p>
        <div className="grid grid-cols-2 gap-2 p-1 bg-surface border border-border rounded-xl">
          {(["invitation", "billetterie"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`py-2.5 text-xs uppercase tracking-[0.2em] rounded-lg transition ${
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Live preview */}
      <p className="eyebrow mb-4">Aperçu généré</p>
      <EventCard
        title={name}
        date={date}
        location={location}
        tag={mode === "invitation" ? "Privé" : "Public"}
      />

      <button className="mt-8 w-full py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.99] transition">
        Continuer
        <ArrowRight className="size-4" />
      </button>

      <p className="mt-4 text-center font-mono text-[10px] tracking-widest text-muted-foreground">
        INVORA DESIGN ENGINE · CONTRASTE & LISIBILITÉ AUTO
      </p>
    </div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl">
      <span className="text-muted-foreground">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
          {label}
        </div>
        {children}
      </div>
    </label>
  );
}
