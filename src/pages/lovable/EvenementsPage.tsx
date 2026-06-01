import { ArrowUpRight } from 'lucide-react';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';

const events = [
  { t: 'Obsidian Gala', d: '24 DÉC · Paris', s: 'INVITER', n: '482 / 600' },
  { t: 'Showcase 06', d: '06 DÉC · Pantin', s: 'VENDRE', n: '212 / 300' },
  { t: 'Brunch Privé', d: '28 NOV · Saint-Germain', s: 'INVITER', n: '40 / 40' },
];

export default function EvenementsPage() {
  return (
    <div className="pb-4">
      <RoleContextBar location="Mes événements" />
      <div className="px-6">
        <PageHeader
          eyebrow="Catalogue"
          title={
            <>
              Mes
              <br />
              <span className="font-serif italic">expériences.</span>
            </>
          }
          description="Chaque ligne = un univers INVITER ou VENDRE."
        />

        <div className="space-y-3">
          {events.map((e) => (
            <article
              key={e.t}
              className="flex items-center gap-4 p-4 bg-surface border border-border rounded-2xl"
            >
              <div
                className="size-14 shrink-0 rounded-xl"
                style={{ background: 'linear-gradient(135deg, oklch(0.18 0 0), oklch(0.1 0 0))' }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-medium truncate">{e.t}</h3>
                <p className="font-mono text-[10px] tracking-widest text-muted-foreground mt-1 uppercase">
                  {e.d}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 border border-border rounded-full">
                    {e.s}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">{e.n}</span>
                </div>
              </div>
              <ArrowUpRight className="size-4 text-muted-foreground shrink-0" />
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
