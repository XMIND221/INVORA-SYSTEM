import { Link, useSearchParams } from 'react-router-dom';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import {
  lovableEventHub,
  lovableEventInviter,
  lovableEventVendre,
  LOVABLE_ROUTES,
} from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { FlowStrip } from '@/components/lovable/FlowStrip';
import { OrganizerJourneyStrip } from '@/components/lovable/OrganizerJourneyStrip';
import {
  INVITER_FLOW,
  UNIVERSE_COPY,
  VENDRE_FLOW,
} from '@/integration/lovable/product-copy';
import { getOrganizerEvent } from '@/integration/lovable/organizer-mock';
import type { EventUniverse } from '@/types/event';

type StepStatus = 'done' | 'now' | 'todo';

function getSteps(universe: EventUniverse, nowIndex: number) {
  const flow = universe === 'inviter' ? INVITER_FLOW : VENDRE_FLOW;
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
  const eventId = params.get('event');
  const event = eventId ? getOrganizerEvent(eventId) : undefined;
  const copy = UNIVERSE_COPY[univers];
  const nowIndex = event?.universeFlowStep ?? (univers === 'inviter' ? 2 : 1);
  const steps = getSteps(univers, nowIndex);
  const current = steps.find((s) => s.status === 'now');
  const progress = (steps.filter((s) => s.status === 'done').length / steps.length) * 100;
  const eventTitle = event?.title ?? 'Obsidian Gala';
  const hubTo = event ? lovableEventHub(event.id) : LOVABLE_ROUTES.evenements;

  return (
    <div className="pb-4">
      <RoleContextBar location={`Parcours ${copy.title}`} />
      <div className="px-6">
        <Link
          to={hubTo}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          Centre de contrôle
        </Link>

        <PageHeader
          eyebrow={`${eventTitle} · ${copy.badge}`}
          title={
            <>
              Parcours
              <br />
              <span className="font-serif italic">{copy.title}</span>
            </>
          }
          description={copy.subtitle}
        />

        <OrganizerJourneyStrip currentStep={3} compact />
        <FlowStrip universe={univers} currentStep={nowIndex} />

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

        {univers === 'inviter' && event ? (
          <Link
            to={lovableEventInviter(event.id)}
            className="mt-6 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
          >
            Ouvrir INVITER Engine <ArrowRight className="size-3" />
          </Link>
        ) : event ? (
          <Link
            to={lovableEventVendre(event.id)}
            className="mt-6 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
          >
            Ouvrir VENDRE Engine <ArrowRight className="size-3" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
