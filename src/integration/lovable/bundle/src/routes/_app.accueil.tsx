import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Plus, Share2, Link2, Copy, Sparkles, TrendingUp, ChevronRight } from "lucide-react";
import { useRole, ROLE_LABEL } from "@/lib/use-role";
import { PageHeader } from "@/components/PageHeader";
import { Stat } from "@/components/Stat";
import { EventCard } from "@/components/EventCard";

export const Route = createFileRoute("/_app/accueil")({
  head: () => ({
    meta: [
      { title: "Accueil — INVORA" },
      { name: "description", content: "Votre dashboard INVORA personnalisé." },
    ],
  }),
  component: Accueil,
});

function Accueil() {
  const role = useRole();
  if (role === "participant") return <ParticipantHome />;
  if (role === "partenaire") return <PartnerHome />;
  if (role === "scanner") return <ScannerHome />;
  return <OrganizerHome />;
}

/* ---------- ORGANISATEUR ---------- */
function OrganizerHome() {
  return (
    <div className="px-6 pt-12">
      <div className="flex items-center justify-between mb-10">
        <p className="eyebrow">{ROLE_LABEL.organisateur} · Marc</p>
        <Link to="/" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
          Changer
        </Link>
      </div>

      <PageHeader
        eyebrow="Dashboard"
        title={<>Bonjour,<br /><span className="font-serif italic">Marc.</span></>}
      />

      {/* Next action card */}
      <Link
        to="/parcours"
        className="block p-5 mb-8 rounded-2xl bg-gradient-to-br from-primary to-white/90 text-primary-foreground"
      >
        <p className="text-[10px] uppercase tracking-[0.25em] opacity-60 mb-2">Prochaine action</p>
        <p className="font-serif italic text-2xl leading-tight mb-1">Publier Obsidian Gala</p>
        <p className="text-xs opacity-70 mb-4">3 dernières étapes — billetterie, invitations, partage.</p>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Reprendre le parcours</span>
          <span className="size-8 rounded-full bg-primary-foreground/10 flex items-center justify-center">
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </Link>

      {/* Journey strip */}
      <p className="eyebrow mb-3">Parcours événement</p>
      <ol className="grid grid-cols-5 gap-1 mb-8">
        {[
          { l: "Créer", s: "done" },
          { l: "Config", s: "done" },
          { l: "Publier", s: "now" },
          { l: "Gérer", s: "todo" },
          { l: "Analyser", s: "todo" },
        ].map((s) => (
          <li key={s.l} className="text-center">
            <div
              className={`h-1 rounded-full mb-2 ${
                s.s === "done" ? "bg-foreground" : s.s === "now" ? "bg-foreground/60" : "bg-border"
              }`}
            />
            <span className={`text-[9px] uppercase tracking-[0.18em] ${s.s === "todo" ? "text-muted-foreground" : "text-foreground"}`}>
              {s.l}
            </span>
          </li>
        ))}
      </ol>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 py-6 border-y border-border mb-10">
        <Stat label="Revenus" value="12.4k€" trend="+18%" />
        <Stat label="Billets" value="482" trend="3 events" />
        <Stat label="Scans" value="92%" trend="taux" />
      </div>

      <section className="mb-10">
        <div className="flex items-end justify-between mb-4">
          <h2 className="eyebrow">Prochain événement</h2>
          <Link to="/evenements" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            Tout voir <ArrowUpRight className="size-3" />
          </Link>
        </div>
        <EventCard />
      </section>

      <section>
        <h2 className="eyebrow mb-4">Activité récente</h2>
        <ul className="space-y-3">
          {[
            { t: "12 billets vendus", s: "Obsidian Gala", d: "il y a 4 min" },
            { t: "Invitation envoyée à Léa Martin", s: "Soirée Velours", d: "il y a 1 h" },
            { t: "Scan validé · porte A", s: "Showcase 06", d: "il y a 3 h" },
          ].map((row) => (
            <li key={row.t} className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{row.t}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{row.s}</p>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground shrink-0 ml-3">{row.d}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/* ---------- PARTICIPANT ---------- */
function ParticipantHome() {
  return (
    <div className="px-6 pt-12">
      <div className="flex items-center justify-between mb-10">
        <p className="eyebrow">{ROLE_LABEL.participant} · Léa</p>
        <Link to="/" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">Changer</Link>
      </div>
      <PageHeader
        eyebrow="Mes accès"
        title={<>Votre soirée<br /><span className="font-serif italic">vous attend.</span></>}
        description="Présentez votre QR à l'entrée."
      />
      <EventCard title="Soirée Velours" date="14 NOV" location="Le Marais, Paris" tag="Confirmé" />
      <h2 className="eyebrow mt-10 mb-4">Vos prochains accès</h2>
      <ul className="space-y-3">
        {[{ t: "Brunch Privé", d: "28 NOV · 11h00" }, { t: "Showcase 06", d: "06 DÉC · 19h30" }].map((e) => (
          <li key={e.t} className="flex items-center justify-between p-4 bg-surface border border-border rounded-xl">
            <div>
              <p className="text-sm font-medium">{e.t}</p>
              <p className="font-mono text-[10px] tracking-widest text-muted-foreground mt-1">{e.d}</p>
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- PARTENAIRE ---------- */
function PartnerHome() {
  return (
    <div className="px-6 pt-12">
      <div className="flex items-center justify-between mb-10">
        <p className="eyebrow">{ROLE_LABEL.partenaire} · Ana</p>
        <Link to="/" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">Changer</Link>
      </div>

      <PageHeader
        eyebrow="Commissions"
        title={<>840,50€<br /><span className="font-serif italic">à retirer.</span></>}
        description="Partagez vos liens. Touchez 20% sur chaque vente."
      />

      {/* Primary CTA — withdraw */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-surface-2 to-surface border border-border-strong mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="eyebrow mb-2">Disponible</p>
            <p className="font-serif text-5xl tracking-tight leading-none">
              840<span className="text-muted-foreground">,50€</span>
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-1 border border-[color:var(--color-success)]/40 text-[color:var(--color-success)] rounded-full">
            Prêt
          </span>
        </div>
        <button className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium active:scale-[0.99] transition flex items-center justify-center gap-2">
          Retirer sur mon compte
          <ArrowUpRight className="size-4" />
        </button>
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-3 text-center">
          Virement SEPA · 1 à 2 jours ouvrés
        </p>
      </div>

      {/* Next action — onboarding */}
      <Link
        to="/evenements"
        className="flex items-center gap-4 p-5 mb-8 bg-surface border border-border rounded-2xl active:scale-[0.99] transition"
      >
        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="size-4 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-1">Prochaine action</p>
          <p className="text-sm font-medium">Partager 2 nouveaux liens cette semaine</p>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </Link>

      {/* How to earn — 3 steps */}
      <p className="eyebrow mb-4">Comment gagner</p>
      <ol className="space-y-3 mb-10">
        {[
          { n: "01", t: "Récupérez votre lien", d: "Un lien unique par événement, traçable à 100%." },
          { n: "02", t: "Partagez-le partout", d: "Stories, WhatsApp, email, bouche-à-oreille." },
          { n: "03", t: "Touchez 20%", d: "Sur chaque billet vendu via votre lien." },
        ].map((s) => (
          <li key={s.n} className="flex gap-4 p-4 bg-surface border border-border rounded-xl">
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground pt-1">{s.n}</span>
            <div className="flex-1">
              <p className="text-sm font-medium">{s.t}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>

      {/* Performance */}
      <div className="grid grid-cols-3 gap-4 py-6 border-y border-border mb-8">
        <Stat label="Ce mois" value="1 240€" trend="+24%" />
        <Stat label="Ventes" value="38" trend="taux 12%" />
        <Stat label="Clics" value="312" trend="lien actif" />
      </div>

      {/* Active links */}
      <div className="flex items-end justify-between mb-4">
        <h2 className="eyebrow">Vos liens actifs</h2>
        <button className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground inline-flex items-center gap-1">
          <Plus className="size-3" /> Nouveau
        </button>
      </div>
      <ul className="space-y-3">
        {[
          { t: "Obsidian Gala", url: "invora.co/o/ana-23", v: "18 ventes · 360€", trend: "+12%" },
          { t: "Showcase 06", url: "invora.co/o/ana-06", v: "20 ventes · 480€", trend: "+8%" },
        ].map((e) => (
          <li key={e.t} className="p-4 bg-surface border border-border rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium">{e.t}</p>
                <p className="font-mono text-[10px] tracking-widest text-muted-foreground mt-1">{e.v}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] text-[color:var(--color-success)]">
                <TrendingUp className="size-3" /> {e.trend}
              </span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-background border border-border rounded-lg">
              <Link2 className="size-3.5 text-muted-foreground shrink-0 ml-1" />
              <span className="font-mono text-[10px] text-foreground/80 truncate flex-1">{e.url}</span>
              <button className="size-7 rounded-md border border-border flex items-center justify-center"><Copy className="size-3" /></button>
              <button className="size-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center"><Share2 className="size-3" /></button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- SCANNER ---------- */
function ScannerHome() {
  return (
    <div className="px-6 pt-12">
      <div className="flex items-center justify-between mb-10">
        <p className="eyebrow">{ROLE_LABEL.scanner} · Porte A</p>
        <Link to="/" className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">Changer</Link>
      </div>
      <PageHeader
        eyebrow="Session active"
        title={<>Mode<br /><span className="font-serif italic">Scanner.</span></>}
        description="Approchez un QR pour valider l'accès."
      />
      <Link to="/scanner" className="block aspect-[4/5] rounded-2xl border border-border-strong bg-surface relative overflow-hidden mb-8">
        <div className="absolute inset-6 border border-white/15 rounded-xl" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="size-20 rounded-full bg-white/5 border border-border-strong flex items-center justify-center">
            <div className="size-10 border-2 border-white rounded" />
          </div>
          <p className="text-sm font-medium">Lancer le scan</p>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground">EN ATTENTE</p>
        </div>
      </Link>
      <div className="grid grid-cols-3 gap-4 py-6 border-y border-border">
        <Stat label="Validés" value="218" />
        <Stat label="Refusés" value="3" />
        <Stat label="Total" value="221" />
      </div>
    </div>
  );
}
