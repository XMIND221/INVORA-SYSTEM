import { Link, useSearchParams } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { FlowStrip } from '@/components/lovable/FlowStrip';
import {
  INVITER_FLOW,
  UNIVERSE_COPY,
  VENDRE_FLOW,
} from '@/integration/lovable/product-copy';
import type { EventUniverse } from '@/types/event';

type StepStatus = 'done' | 'now' | 'todo';

function getSteps(universe: EventUniverse) {
  const flow = universe === 'inviter' ? INVITER_FLOW : VENDRE_FLOW;
  const nowIndex = universe === 'inviter' ? 2 : 1;
  return flow.map((step, i) => ({
    ...step,
    status: (i < nowIndex ? 'done' : i === nowIndex ? 'now' : 'todo') as StepStatus,
    next:
      i === nowIndex
        ? universe === 'inviter'
          ? 'Envoyer les invitations en attente'
          : 'Configurer les types de billets'
        : undefined,
  }));
}

export default function ParcoursPage() {
  const [params] = useSearchParams();
  const univers = (params.get('univers') === 'vendre' ? 'vendre' : 'inviter') as EventUniverse;
  const copy = UNIVERSE_COPY[univers];
  const steps = getSteps(univers);
  const current = steps.find((s) => s.status === 'now');
  const progress = (steps.filter((s) => s.status === 'done').length / steps.length) * 100;

  return (
    <div className="pb-4">
      <RoleContextBar location={`Parcours ${copy.title}`} />
      <div className="px-6">
        <PageHeader
          eyebrow={`Obsidian Gala · ${copy.badge}`}
          title={
            <>
              Parcours
              <br />
              <span className="font-serif italic">{copy.title}</span>
            </>
          }
          description={copy.subtitle}
        />

        <FlowStrip universe={univers} currentStep={steps.findIndex((s) => s.status === 'now')} />

        <div className="flex items-center justify-between mb-2 mt-4">
          <span className="eyebrow">Avancement</span>
          <span className="font-mono text-[10px] text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <div className="h-1 bg-border rounded-full overflow-hidden mb-6">
          <div className="h-full bg-foreground transition-all" style={{ width: `${progress}%` }} />
        </div>

        {current && (
          <div className="p-5 mb-6 rounded-2xl bg-primary text-primary-foreground">
            <p className="text-[10px] uppercase tracking-[0.25em] opacity-60 mb-1">À faire maintenant</p>
            <p className="font-serif italic text-xl">{current.label}</p>
            {current.next && <p className="text-xs opacity-70 mt-2">{current.next}</p>}
          </div>
        )}

        <ol className="space-y-3">
          {steps.map((s) => (
            <li
              key={s.key}
              className={`p-4 rounded-xl border ${
                s.status === 'now' ? 'bg-surface-2 border-border-strong' : 'bg-surface border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`size-8 rounded-full flex items-center justify-center border ${
                    s.status === 'done'
                      ? 'bg-foreground text-background'
                      : s.status === 'now'
                        ? 'border-foreground'
                        : 'border-border text-muted-foreground'
                  }`}
                >
                  {s.status === 'done' ? <Check className="size-3.5" /> : null}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
                    {s.status === 'done' ? 'Fait' : s.status === 'now' ? 'En cours' : 'À venir'}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>

        {univers === 'inviter' && (
          <Link
            to={LOVABLE_ROUTES.creer}
            className="mt-6 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
          >
            Modifier l’expérience <ArrowRight className="size-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
