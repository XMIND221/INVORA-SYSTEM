import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Pause, Play, RotateCcw, Search, X, Zap, ZapOff } from 'lucide-react';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { ScannerGatePicker } from '@/components/lovable/ScannerGatePicker';
import { ScannerLivePanel } from '@/components/lovable/ScannerLivePanel';
import { ScannerResultOverlay } from '@/components/lovable/ScannerResultOverlay';
import { Stat } from '@/components/lovable/Stat';
import { gateLabel } from '@/features/engines/scanner.engine';
import { SCANNER_ENGINE_COPY } from '@/integration/lovable/product-copy';
import {
  lovableScannerAnalytics,
  lovableScannerHistory,
  lovableScannerSearch,
} from '@/lib/constants';
import { pendingOfflineCount } from '@/lib/scanner-offline-queue';
import { scannerService } from '@/services/scanner.service';
import type { ScannerGateCode, ScannerValidationDisplay } from '@/types/scanner';

const DEMO_PASSES = [
  'INV-OBSIDI-4827',
  'tok-aminata-obsidian',
  'FAKE-QR-INVALID',
] as const;

export default function ScannerPage() {
  const session = scannerService.getSession();
  const [gate, setGate] = useState<ScannerGateCode>(session.gateCode);
  const [paused, setPaused] = useState(false);
  const [torch, setTorch] = useState(false);
  const [result, setResult] = useState<ScannerValidationDisplay | null>(null);
  const [busy, setBusy] = useState(false);
  const [demoIdx, setDemoIdx] = useState(0);
  const [offlineCount, setOfflineCount] = useState(pendingOfflineCount());
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const live = scannerService.liveStats();

  const runScan = useCallback(
    async (passReference: string) => {
      if (busy) return;
      setBusy(true);
      scannerService.setGate(gate);
      try {
        const display = await scannerService.validateScan({
          eventId: session.eventId,
          passReference,
          gateCode: gate,
          deviceId: 'web-scanner-demo',
          offline: !navigator.onLine,
        });
        setResult(display);
        setOfflineCount(pendingOfflineCount());
        if (resetTimer.current) clearTimeout(resetTimer.current);
        resetTimer.current = setTimeout(() => setResult(null), 1600);
      } finally {
        setBusy(false);
      }
    },
    [busy, gate, session.eventId],
  );

  useEffect(() => {
    if (paused || busy || result) return;
    const t = setTimeout(() => {
      void runScan(DEMO_PASSES[demoIdx % DEMO_PASSES.length]!);
      setDemoIdx((i) => i + 1);
    }, 2800);
    return () => clearTimeout(t);
  }, [paused, busy, result, demoIdx, runScan]);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  const flash =
    result?.status === 'validated'
      ? 'shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-success)_65%,transparent)]'
      : result?.status === 'denied'
        ? 'shadow-[0_0_0_4px_color-mix(in_oklab,var(--color-destructive)_65%,transparent)]'
        : '';

  return (
    <div className="pb-4 min-h-[100dvh] bg-background">
      <RoleContextBar location="Scanner Pro" />
      <div className="px-6 pt-2 pb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${paused ? 'bg-muted-foreground' : 'bg-[color:var(--color-success)] animate-pulse'}`}
            />
            <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground">
              {paused ? 'Pause' : 'Live'} · {gateLabel(gate)}
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[40%]">
            {session.eventTitle}
          </span>
        </div>

        <ScannerGatePicker value={gate} onChange={setGate} />

        <div
          className={`relative aspect-[3/4] rounded-3xl overflow-hidden bg-black border border-border-strong mt-4 mb-3 transition-shadow duration-200 ${flash}`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-surface-2 via-black to-background" />
          <div
            className="absolute left-[12%] right-[12%] h-0.5 bg-primary/80 pointer-events-none"
            style={{ animation: paused ? 'none' : 'scan 2.4s ease-in-out infinite' }}
          />
          <ScannerResultOverlay display={result} />
          {!result && !paused && (
            <p className="absolute bottom-4 inset-x-0 text-center text-[10px] uppercase tracking-[0.2em] text-white/40">
              {SCANNER_ENGINE_COPY.scanHint}
            </p>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          <CtrlBtn icon={torch ? <Zap className="size-4" /> : <ZapOff className="size-4" />} label="Torche" onClick={() => setTorch((t) => !t)} />
          <CtrlBtn
            icon={paused ? <Play className="size-4" /> : <Pause className="size-4" />}
            label={paused ? 'Reprendre' : 'Pause'}
            onClick={() => {
              setPaused((p) => {
                scannerService.setPaused(!p);
                return !p;
              });
            }}
            primary
          />
          <CtrlBtn icon={<RotateCcw className="size-4" />} label="Reset" onClick={() => setResult(null)} />
          <Link
            to={lovableScannerSearch()}
            className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border bg-surface border-border"
          >
            <Search className="size-4" />
            <span className="text-[9px] uppercase tracking-[0.18em]">Manuel</span>
          </Link>
        </div>

        {offlineCount > 0 && (
          <button
            type="button"
            className="w-full mb-4 py-2 text-xs border border-border rounded-xl text-muted-foreground hover:text-foreground"
            onClick={() => void scannerService.syncOffline().then(() => setOfflineCount(pendingOfflineCount()))}
          >
            {SCANNER_ENGINE_COPY.offlineSync} ({offlineCount})
          </button>
        )}

        <div className="grid grid-cols-3 gap-3 py-4 border-y border-border mb-4">
          <Stat label="Validés" value={String(live.entered)} trend={`${live.presenceRate}%`} />
          <Stat label="Refusés" value={String(live.denied)} />
          <Stat label="Cadence" value="<2s" />
        </div>

        <ScannerLivePanel
          stats={live}
          historyLink={lovableScannerHistory()}
          analyticsLink={lovableScannerAnalytics()}
        />

        <p className="eyebrow mt-6 mb-3">{SCANNER_ENGINE_COPY.recent}</p>
        <ul className="space-y-2">
          {scannerService.listHistory().slice(0, 5).map((r) => (
            <li key={r.id} className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl">
              {r.status === 'validated' ? (
                <Check className="size-3.5 text-[color:var(--color-success)]" />
              ) : (
                <X className="size-3.5 text-destructive" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.guestName}</p>
                <p className="text-[10px] text-muted-foreground">{gateLabel(r.gateCode)}</p>
              </div>
              <span className="font-mono text-[10px] text-muted-foreground shrink-0">
                {new Date(r.at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <style>{`@keyframes scan{0%,100%{top:18%}50%{top:82%}}`}</style>
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
