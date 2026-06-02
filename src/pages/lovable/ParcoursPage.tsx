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
import { useQuery } from '@tanstack/react-query';
import { getOrganizerEventView } from '@/services/events.service';
import type { EventUniverse } from '@/types/event';
import { LoadingPage, NotFoundState } from '@/components/lovable/ui-states';

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
  const eventKey = params.get('event') ?? undefined;

  const eventQuery = useQuery({
    queryKey: ['organizer-event', eventKey],
    queryFn: () => (eventKey ? getOrganizerEventView(eventKey) : null),
    enabled: !!eventKey,
  });

  const event = eventQuery.data;
  const isLoading = !!eventKey && eventQuery.isLoading;

  const copy = UNIVERSE_COPY[univers];
  const nowIndex = event?.universeFlowStep ?? (univers === 'inviter' ? 0 : 0);
  const steps = getSteps(univers, nowIndex);
  const current = steps.find((s) => s.status === 'now');
  const progress = (steps.filter((s) => s.status === 'done').length / steps.length) * 100;
  const eventTitle = event?.title ?? 'Votre expérience';
  const hubTo = event ? lovableEventHub(event.id) : LOVABLE_ROUTES.evenements;

  if (isLoading) {
    return (
      <div className="pb-4">
        <RoleContextBar location="Parcours" />
        <LoadingPage />
      </div>
    );
  }

  if (eventKey && !event && !eventQuery.isLoading) {
    return <NotFoundState title="Événement introuvable" backTo={LOVABLE_ROUTES.evenements} />;
  }

  return (
    <div className="pb-4">
      <RoleContextBar location="Parcours" />
      <div className="px-6">
        <Link
          to={hubTo}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3" />
          {eventTitle}
        </Link>

        <PageHeader
          eyebrow={`Parcours · ${copy.title}`}
          title={
            <>
              Votre
              <br />
              <span className="font-serif italic">parcours.</span>
            </>
          }
          description={copy.subtitle}
        />

        <OrganizerJourneyStrip currentStep={event?.journeyStep ?? 1} compact />
        <FlowStrip universe={univers} currentStep={nowIndex} />

        <div className="mt-6 h-1 bg-surface-2 rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="mt-8 space-y-4">
          {steps.map((step) => (
            <div
              key={step.key}
              className={`p-4 rounded-xl border ${
                step.status === 'now' ? 'border-border-strong bg-surface' : 'border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`size-6 rounded-full flex items-center justify-center text-[10px] ${
                    step.status === 'done'
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border text-muted-foreground'
                  }`}
                >
                  {step.status === 'done' ? <Check className="size-3" /> : step.key}
                </span>
                <div>
                  <p className="text-sm font-medium">{step.label}</p>
                  {step.status === 'now' && step.next ? (
                    <p className="text-xs text-muted-foreground mt-1">{step.next}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>

        {current ? (
          <Link
            to={univers === 'inviter' && event ? lovableEventInviter(event.id) : event ? lovableEventVendre(event.id) : LOVABLE_ROUTES.creer}
            className="mt-8 flex items-center justify-center gap-2 w-full py-4 bg-primary text-primary-foreground rounded-2xl text-sm"
          >
            Action suivante
            <ArrowRight className="size-4" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
