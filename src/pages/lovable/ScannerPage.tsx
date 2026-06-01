import { useEffect, useState } from 'react';
import { Check, X, Zap, ZapOff, RotateCcw, Pause, Play } from 'lucide-react';
import { Stat } from '@/components/lovable/Stat';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { SCANNER_COPY } from '@/integration/lovable/product-copy';

type ResultState =
  | { state: 'idle' }
  | { state: 'ok'; name: string; pass: string }
  | { state: 'deny'; reason: string };

export default function ScannerPage() {
  const [running, setRunning] = useState(true);
  const [torch, setTorch] = useState(false);
  const [result, setResult] = useState<ResultState>({ state: 'idle' });
  const [history, setHistory] = useState([
    { id: 1, name: 'Léa Martin', ok: true, ago: '4s' },
    { id: 2, name: 'Karim B.', ok: true, ago: '18s' },
    { id: 3, name: 'Inconnu', ok: false, reason: 'Pass invalide', ago: '42s' },
  ]);

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => {
      const ok = Math.random() > 0.25;
      if (ok) {
        setResult({ state: 'ok', name: 'Sofia D.', pass: '#4828' });
        setHistory((h) => [{ id: Date.now(), name: 'Sofia D.', ok: true, ago: '1s' }, ...h].slice(0, 6));
      } else {
        setResult({ state: 'deny', reason: 'Pass déjà utilisé' });
        setHistory((h) => [
          { id: Date.now(), name: 'Inconnu', ok: false, reason: 'Doublon', ago: '1s' },
          ...h,
        ].slice(0, 6));
      }
      setTimeout(() => setResult({ state: 'idle' }), 1800);
    }, 3200);
    return () => clearTimeout(t);
  }, [running, history.length]);

  const flash =
    result.state === 'ok'
      ? 'shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-success)_70%,transparent)]'
      : result.state === 'deny'
        ? 'shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-destructive)_70%,transparent)]'
        : '';

  return (
    <div className="pb-4">
      <RoleContextBar location="Scanner" />
      <div className="px-6 pt-2 pb-6">
      <p className="text-xs text-muted-foreground mb-4">{SCANNER_COPY.scan}</p>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span
            className={`size-2 rounded-full ${running ? 'bg-[color:var(--color-success)] animate-pulse' : 'bg-muted-foreground'}`}
          />
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
            {running ? 'Live · Porte A' : 'En pause'}
          </span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">Obsidian Gala</span>
      </div>

      <div
        className={`relative aspect-[3/4] rounded-3xl overflow-hidden bg-black border border-border-strong mb-4 transition-shadow ${flash}`}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-surface-2 via-black to-background" />
        {result.state !== 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm">
            <p className="text-white font-serif italic text-3xl">
              {result.state === 'ok' ? 'Validé' : 'Refusé'}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <CtrlBtn onClick={() => setTorch((t) => !t)} icon={torch ? <Zap className="size-4" /> : <ZapOff className="size-4" />} label="Torche" />
        <CtrlBtn onClick={() => setRunning((r) => !r)} icon={running ? <Pause className="size-4" /> : <Play className="size-4" />} label={running ? 'Pause' : 'Reprendre'} primary />
        <CtrlBtn onClick={() => setResult({ state: 'idle' })} icon={<RotateCcw className="size-4" />} label="Reset" />
      </div>

      <div className="grid grid-cols-3 gap-4 py-5 border-y border-border mb-5">
        <Stat label="Validés" value="218" trend="98.6%" />
        <Stat label="Refusés" value="3" />
        <Stat label="Cadence" value="42/min" />
      </div>

      <p className="eyebrow mb-3">{SCANNER_COPY.history}</p>
      <ul className="space-y-2">
        {history.map((r) => (
          <li key={r.id} className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl">
            {r.ok ? <Check className="size-3.5 text-[color:var(--color-success)]" /> : <X className="size-3.5 text-destructive" />}
            <p className="text-sm font-medium flex-1">{r.name}</p>
            <span className="font-mono text-[10px] text-muted-foreground">il y a {r.ago}</span>
          </li>
        ))}
      </ul>
      <style>{`@keyframes scan{0%,100%{top:18%}50%{top:82%}}`}</style>
      </div>
    </div>
  );
}

function CtrlBtn({
  icon,
  label,
  onClick,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border ${
        primary ? 'bg-primary text-primary-foreground border-primary' : 'bg-surface border-border'
      }`}
    >
      {icon}
      <span className="text-[9px] uppercase tracking-[0.18em]">{label}</span>
    </button>
  );
}
