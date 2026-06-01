import { useState } from 'react';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { WALLET_COPY } from '@/integration/lovable/product-copy';
import {
  Wallet,
  Apple,
  Share2,
  Download,
  Mail,
  Ticket,
  Check,
  Clock,
  ChevronRight,
} from 'lucide-react';

type Tab = 'billets' | 'invitations' | 'historique';

export default function AccesPage() {
  const [tab, setTab] = useState<Tab>('billets');

  return (
    <div className="pb-4">
      <RoleContextBar location={WALLET_COPY.title} />
      <div className="px-6">
        <PageHeader
          eyebrow={WALLET_COPY.subtitle}
          title={
            <>
              {WALLET_COPY.title},
              <br />
              <span className="font-serif italic">en un geste.</span>
            </>
          }
          description={WALLET_COPY.youGet}
        />
        <p className="text-xs text-muted-foreground mb-6 p-3 border border-border rounded-lg bg-surface">
          {WALLET_COPY.notARole}
        </p>
      <PrimaryPass />
      <div className="grid grid-cols-3 gap-2 mt-4 mb-8">
        <WalletAction icon={<Apple className="size-4" />} label="Apple Wallet" />
        <WalletAction icon={<Wallet className="size-4" />} label="Google Pay" />
        <WalletAction icon={<Share2 className="size-4" />} label="Partager" />
      </div>
      <div className="grid grid-cols-3 gap-1 p-1 bg-surface border border-border rounded-xl mb-5">
        {(
          [
            { id: 'billets' as Tab, l: 'Billets' },
            { id: 'invitations' as Tab, l: 'Invitations' },
            { id: 'historique' as Tab, l: 'Historique' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`py-2 text-[10px] uppercase tracking-[0.2em] rounded-lg transition ${
              tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>
      {tab === 'billets' && <Billets />}
      {tab === 'invitations' && <Invitations />}
      {tab === 'historique' && <Historique />}
      </div>
    </div>
  );
}

function PrimaryPass() {
  return (
    <article className="relative rounded-[28px] p-1 bg-gradient-to-b from-white/15 to-transparent">
      <div className="relative rounded-[24px] overflow-hidden border border-white/10 bg-surface">
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div>
            <p className="eyebrow">Invora Pass · Actif</p>
            <p className="font-serif italic text-2xl mt-1">Soirée Velours</p>
          </div>
          <span className="size-2 rounded-full bg-[color:var(--color-success)]" />
        </div>
        <div className="px-5 grid grid-cols-3 gap-3 py-3 border-y border-border">
          <Meta l="Date" v="14 NOV" />
          <Meta l="Porte" v="19:30" />
          <Meta l="Place" v="GA · 142" />
        </div>
        <div className="p-6 flex flex-col items-center">
          <div className="p-3 bg-white rounded-2xl">
            <div className="size-44 grid grid-cols-12 gap-[2px]">
              {Array.from({ length: 144 }).map((_, i) => {
                const corner =
                  (i < 36 && i % 12 < 3) ||
                  (i < 36 && i % 12 > 8) ||
                  (i >= 108 && i % 12 < 3);
                const on = corner || (i * 53) % 7 < 3;
                return (
                  <div key={i} className={`rounded-[1px] ${on ? 'bg-black' : 'bg-black/5'}`} />
                );
              })}
            </div>
          </div>
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-muted-foreground mt-4">
            PASS #4827 · LÉA MARTIN
          </p>
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
    <button
      type="button"
      className="flex flex-col items-center gap-1.5 py-3 bg-surface border border-border rounded-xl"
    >
      <span className="text-foreground">{icon}</span>
      <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
    </button>
  );
}

function Billets() {
  const items = [
    { t: 'Brunch Privé', d: '28 NOV · 11:00', tag: 'GA' },
    { t: 'Showcase 06', d: '06 DÉC · 19:30', tag: 'VIP' },
  ];
  return (
    <ul className="space-y-3">
      {items.map((e) => (
        <li
          key={e.t}
          className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl"
        >
          <Ticket className="size-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium">{e.t}</p>
            <p className="font-mono text-[10px] text-muted-foreground mt-1">{e.d}</p>
          </div>
          <Download className="size-3.5" />
        </li>
      ))}
    </ul>
  );
}

function Invitations() {
  return (
    <ul className="space-y-3">
      {[
        { t: 'Vernissage Studio K', d: 'Sandra · 20 NOV', s: 'À confirmer' },
        { t: 'Dîner Atelier', d: 'Marc · 02 DÉC', s: 'Acceptée' },
      ].map((e) => (
        <li key={e.t} className="p-4 bg-surface border border-border rounded-xl">
          <div className="flex items-center gap-3 mb-3">
            <Mail className="size-4 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">{e.t}</p>
              <p className="text-[11px] text-muted-foreground">{e.d}</p>
            </div>
            <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">{e.s}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Historique() {
  return (
    <ul className="space-y-3">
      {[
        { t: 'Showcase 05', d: '12 OCT', ok: true },
        { t: 'Pop-up A14', d: '02 SEP', ok: false },
      ].map((e) => (
        <li key={e.t} className="flex items-center gap-3 p-4 bg-surface border border-border rounded-xl">
          {e.ok ? <Check className="size-4 text-[color:var(--color-success)]" /> : <Clock className="size-4" />}
          <div className="flex-1">
            <p className="text-sm font-medium">{e.t}</p>
            <p className="font-mono text-[10px] text-muted-foreground">{e.d}</p>
          </div>
          <ChevronRight className="size-3" />
        </li>
      ))}
    </ul>
  );
}
