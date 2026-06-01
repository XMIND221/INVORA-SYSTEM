import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X, Zap, ZapOff, RotateCcw, Pause, Play } from "lucide-react";
import { Stat } from "@/components/Stat";

export const Route = createFileRoute("/_app/scanner")({
  head: () => ({ meta: [{ title: "Scanner — INVORA" }] }),
  component: Scanner,
});

type ResultState = { state: "idle" } | { state: "ok"; name: string; pass: string } | { state: "deny"; reason: string };

function Scanner() {
  const [running, setRunning] = useState(true);
  const [torch, setTorch] = useState(false);
  const [result, setResult] = useState<ResultState>({ state: "idle" });
  const [history, setHistory] = useState<{ id: number; name: string; ok: boolean; reason?: string; ago: string }[]>([
    { id: 1, name: "Léa Martin", ok: true, ago: "4s" },
    { id: 2, name: "Karim B.", ok: true, ago: "18s" },
    { id: 3, name: "Inconnu", ok: false, reason: "Pass invalide", ago: "42s" },
  ]);

  // Simulate scans
  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => {
      const ok = Math.random() > 0.25;
      if (ok) {
        setResult({ state: "ok", name: "Sofia D.", pass: "#4828" });
        setHistory((h) => [{ id: Date.now(), name: "Sofia D.", ok: true, ago: "1s" }, ...h].slice(0, 6));
      } else {
        setResult({ state: "deny", reason: "Pass déjà utilisé" });
        setHistory((h) => [{ id: Date.now(), name: "Inconnu", ok: false, reason: "Doublon", ago: "1s" }, ...h].slice(0, 6));
      }
      setTimeout(() => setResult({ state: "idle" }), 1800);
    }, 3200);
    return () => clearTimeout(t);
  }, [running, history.length]);

  const flash =
    result.state === "ok"
      ? "shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-success)_70%,transparent),0_0_60px_8px_color-mix(in_oklab,var(--color-success)_45%,transparent)]"
      : result.state === "deny"
        ? "shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-destructive)_70%,transparent),0_0_60px_8px_color-mix(in_oklab,var(--color-destructive)_45%,transparent)]"
        : "shadow-none";

  return (
    <div className="px-6 pt-10 pb-6">
      {/* Live header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${running ? "bg-[color:var(--color-success)] animate-pulse" : "bg-muted-foreground"}`} />
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
            {running ? "Live · Porte A" : "En pause"}
          </span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">Obsidian Gala</span>
      </div>

      {/* Viewfinder */}
      <div className={`relative aspect-[3/4] rounded-3xl overflow-hidden bg-black border border-border-strong mb-4 transition-shadow duration-200 ${flash}`}>
        {/* Camera tone */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-2 via-black to-background" />
        <div className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[length:6px_6px]" />

        {/* Brackets */}
        {(["top-8 left-8 border-l border-t", "top-8 right-8 border-r border-t", "bottom-8 left-8 border-l border-b", "bottom-8 right-8 border-r border-b"] as const).map((c) => (
          <div key={c} className={`absolute size-12 border-white rounded-[8px] ${c}`} style={{ borderWidth: 2 }} />
        ))}

        {/* Scan line */}
        {result.state === "idle" && running && (
          <div className="absolute left-8 right-8 h-px bg-white shadow-[0_0_18px_2px_rgba(255,255,255,0.7)] animate-[scan_2.4s_ease-in-out_infinite]" />
        )}

        {/* Result overlay */}
        {result.state !== "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm">
            <div
              className={`size-28 rounded-full flex items-center justify-center mb-5 ${
                result.state === "ok"
                  ? "bg-[color:var(--color-success)] text-black"
                  : "bg-[color:var(--color-destructive)] text-white"
              }`}
            >
              {result.state === "ok" ? <Check className="size-12" strokeWidth={3} /> : <X className="size-12" strokeWidth={3} />}
            </div>
            <p className="text-white font-serif italic text-3xl">
              {result.state === "ok" ? "Validé" : "Refusé"}
            </p>
            <p className="font-mono text-[10px] tracking-widest text-white/70 uppercase mt-2">
              {result.state === "ok" ? `${result.name} · ${result.pass}` : result.reason}
            </p>
          </div>
        )}

        {/* HUD */}
        <div className="absolute bottom-4 inset-x-4 flex items-center justify-between text-white/70">
          <span className="font-mono text-[10px] tracking-widest uppercase">CAM · 1080p</span>
          <span className="font-mono text-[10px] tracking-widest uppercase">218 / 600</span>
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <CtrlBtn onClick={() => setTorch((t) => !t)} icon={torch ? <Zap className="size-4" /> : <ZapOff className="size-4" />} label={torch ? "Torche on" : "Torche"} />
        <CtrlBtn onClick={() => setRunning((r) => !r)} icon={running ? <Pause className="size-4" /> : <Play className="size-4" />} label={running ? "Pause" : "Reprendre"} primary />
        <CtrlBtn onClick={() => setResult({ state: "idle" })} icon={<RotateCcw className="size-4" />} label="Reset" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 py-5 border-y border-border mb-5">
        <Stat label="Validés" value="218" trend="98.6%" />
        <Stat label="Refusés" value="3" trend="1.4%" />
        <Stat label="Cadence" value="42/min" />
      </div>

      {/* History */}
      <p className="eyebrow mb-3">Derniers scans</p>
      <ul className="space-y-2">
        {history.map((r) => (
          <li key={r.id} className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl">
            <div
              className={`size-7 rounded-full flex items-center justify-center ${
                r.ok ? "bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]" : "bg-[color:var(--color-destructive)]/15 text-[color:var(--color-destructive)]"
              }`}
            >
              {r.ok ? <Check className="size-3.5" /> : <X className="size-3.5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{r.name}</p>
              {!r.ok && <p className="text-[10px] text-muted-foreground">{r.reason}</p>}
            </div>
            <span className="font-mono text-[10px] text-muted-foreground uppercase">il y a {r.ago}</span>
          </li>
        ))}
      </ul>

      <style>{`@keyframes scan{0%,100%{top:18%}50%{top:82%}}`}</style>
    </div>
  );
}

function CtrlBtn({ icon, label, onClick, primary }: { icon: React.ReactNode; label: string; onClick?: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition active:scale-[0.98] ${
        primary
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-surface border-border text-foreground"
      }`}
    >
      {icon}
      <span className="text-[9px] uppercase tracking-[0.18em] opacity-80">{label}</span>
    </button>
  );
}
