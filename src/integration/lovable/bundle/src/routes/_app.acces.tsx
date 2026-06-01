import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Wallet, Apple, Share2, Download, Mail, Ticket, Check, Clock, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_app/acces")({
  head: () => ({ meta: [{ title: "Mes accès — INVORA" }] }),
  component: Acces,
});

type Tab = "billets" | "invitations" | "historique";

function Acces() {
  const [tab, setTab] = useState<Tab>("billets");

  return (
    <div className="px-6 pt-12">
      <PageHeader
        eyebrow="Wallet · Léa"
        title={
          <>
            Vos accès,
            <br />
            <span className="font-serif italic">en un geste.</span>
          </>
        }
        description="Présentez le QR à l'entrée. Tout est ici."
      />

      {/* Hero pass — primary access (Apple-Wallet-like) */}
      <PrimaryPass />

      {/* Wallet quick actions */}
      <div className="grid grid-cols-3 gap-2 mt-4 mb-8">
        <WalletAction icon={<Apple className="size-4" />} label="Apple Wallet" />
        <WalletAction icon={<Wallet className="size-4" />} label="Google Pay" />
        <WalletAction icon={<Share2 className="size-4" />} label="Partager" />
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-surface border border-border rounded-xl mb-5">
        {(
          [
            { id: "billets", l: "Billets" },
            { id: "invitations", l: "Invitations" },
            { id: "historique", l: "Historique" },
          ] as { id: Tab; l: string }[]
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`py-2 text-[10px] uppercase tracking-[0.2em] rounded-lg transition ${
              tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === "billets" && <Billets />}
      {tab === "invitations" && <Invitations />}
      {tab === "historique" && <Historique />}
    </div>
  );
}

function PrimaryPass() {
  return (
    <article className="relative rounded-[28px] p-1 bg-gradient-to-b from-white/15 to-transparent">
      <div className="relative rounded-[24px] overflow-hidden border border-white/10 bg-surface">
        {/* Top band */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <p className="eyebrow">Invora Pass · Actif</p>
            <p className="font-serif italic text-2xl mt-1">Soirée Velours</p>
          </div>
          <span className="size-2 rounded-full bg-[color:var(--color-success)] shadow-[0_0_12px_2px_color-mix(in_oklab,var(--color-success)_60%,transparent)]" />
        </div>

        <div className="px-5 grid grid-cols-3 gap-3 py-3 border-y border-border">
          <Meta l="Date" v="14 NOV" />
          <Meta l="Porte" v="19:30" />
          <Meta l="Place" v="GA · 142" />
        </div>

        {/* QR */}
        <div className="p-6 flex flex-col items-center">
          <div className="p-3 bg-white rounded-2xl">
            <div className="size-44 grid grid-cols-12 gap-[2px]">
              {Array.from({ length: 144 }).map((_, i) => {
                const corner =
                  (i < 36 && (i % 12 < 3)) ||
                  (i < 36 && (i % 12 > 8)) ||
                  (i >= 108 && (i % 12 < 3));
                const on = corner || (i * 53) % 7 < 3;
                return (
                  <div key={i} className={`rounded-[1px] ${on ? "bg-black" : "bg-black/5"}`} />
                );
              })}
            </div>
          </div>
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mt-4">
            PASS #4827 · LÉA MARTIN
          </p>
        </div>

        {/* Tear */}
        <div className="relative">
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 size-4 rounded-full bg-background" />
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 size-4 rounded-full bg-background" />
          <div className="border-t border-dashed border-border" />
        </div>

        <div className="px-5 py-4 flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
            Le Marais, Paris
          </span>
          <button className="text-[10px] uppercase tracking-[0.2em] text-foreground flex items-center gap-1">
            Détails <ChevronRight className="size-3" />
          </button>
        </div>
      </div>
    </article>
  );
}

function Meta({ l, v }: { l: string; v: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{l}</p>
      <p className="text-sm font-medium mt-1">{v}</p>
    </div>
  );
}

function WalletAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex flex-col items-center gap-1.5 py-3 bg-surface border border-border rounded-xl active:scale-[0.98] transition">
      <span className="text-foreground">{icon}</span>
      <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
    </button>
  );
}

function Billets() {
  const items = [
    { t: "Brunch Privé", d: "28 NOV · 11:00", tag: "GA" },
    { t: "Showcase 06", d: "06 DÉC · 19:30", tag: "VIP" },
  ];
  return (
    <ul className="space-y-3">
      {items.map((e) => (
        <li
          key={e.t}
          className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl"
        >
          <div className="size-12 rounded-lg bg-surface-2 border border-border flex items-center justify-center">
            <Ticket className="size-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{e.t}</p>
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground mt-1 uppercase">
              {e.d} · {e.tag}
            </p>
          </div>
          <button className="size-9 rounded-full border border-border-strong flex items-center justify-center">
            <Download className="size-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}

function Invitations() {
  const inv = [
    { t: "Vernissage Studio K", d: "Sandra · 20 NOV", s: "À confirmer" },
    { t: "Dîner Atelier", d: "Marc · 02 DÉC", s: "Acceptée" },
  ];
  return (
    <ul className="space-y-3">
      {inv.map((e) => (
        <li
          key={e.t}
          className="p-4 bg-surface border border-border rounded-xl"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="size-9 rounded-full bg-surface-2 border border-border flex items-center justify-center">
              <Mail className="size-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{e.t}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{e.d}</p>
            </div>
            <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-1 border border-border-strong rounded-full text-muted-foreground">
              {e.s}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button className="py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg">
              Accepter
            </button>
            <button className="py-2 text-xs font-medium border border-border rounded-lg text-muted-foreground">
              Décliner
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Historique() {
  const hist = [
    { t: "Showcase 05", d: "12 OCT", s: "Validé", ok: true },
    { t: "Vernissage Nuit", d: "28 SEP", s: "Validé", ok: true },
    { t: "Pop-up A14", d: "02 SEP", s: "Expiré", ok: false },
  ];
  return (
    <ul className="space-y-3">
      {hist.map((e) => (
        <li
          key={e.t}
          className="flex items-center gap-3 p-4 bg-surface border border-border rounded-xl"
        >
          <div
            className={`size-9 rounded-full flex items-center justify-center ${
              e.ok ? "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]" : "bg-surface-2 text-muted-foreground"
            }`}
          >
            {e.ok ? <Check className="size-4" /> : <Clock className="size-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{e.t}</p>
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground mt-1 uppercase">
              {e.d} · {e.s}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
