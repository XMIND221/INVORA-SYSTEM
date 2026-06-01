import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Camera,
  Calendar,
  MapPin,
  Tag,
  AlignLeft,
} from 'lucide-react';
import {
  lovableEventHub,
  LOVABLE_ROUTES,
  STUDIO_STEPS,
} from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { EventCard } from '@/components/lovable/EventCard';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { OrganizerJourneyStrip } from '@/components/lovable/OrganizerJourneyStrip';
import { StudioStepper } from '@/components/lovable/StudioStepper';
import { DesignEnginePreview } from '@/components/lovable/DesignEnginePreview';
import {
  PUBLICATION_BLOCKER_LABELS,
  STUDIO_STEP_COPY,
  UNIVERSE_COPY,
} from '@/integration/lovable/product-copy';
import { validatePublication } from '@/features/engines/publication.engine';
import { useEventStore } from '@/store/event.store';
import type { EventUniverse, EventVisibility } from '@/types/event';

const DEFAULT_DRAFT = {
  title: 'Obsidian Gala',
  dateLabel: '24 DÉC',
  location: 'Paris, FR',
  description: '',
  universe: 'inviter' as EventUniverse,
  visibility: 'private' as EventVisibility,
  capacity: 600,
};

export default function CreerPage() {
  const navigate = useNavigate();
  const { draft, studioStep, patchDraft, setStudioStep, resetStudio } = useEventStore();

  useEffect(() => {
    if (!draft.title) {
      patchDraft(DEFAULT_DRAFT);
    }
  }, [draft.title, patchDraft]);

  const stepMeta = STUDIO_STEP_COPY[studioStep - 1] ?? STUDIO_STEP_COPY[0];
  const universe = (draft.universe ?? 'inviter') as EventUniverse;
  const copy = UNIVERSE_COPY[universe];
  const title = draft.title ?? '';
  const dateLabel = draft.dateLabel ?? '';
  const location = draft.location ?? '';

  const goNext = () => {
    if (studioStep < STUDIO_STEPS) setStudioStep(studioStep + 1);
  };
  const goBack = () => {
    if (studioStep > 1) setStudioStep(studioStep - 1);
  };

  const publishCheck = validatePublication({
    title: draft.title,
    universe: draft.universe,
    visibility: draft.visibility,
    startsAt: draft.startsAt ?? draft.dateLabel,
  });

  const handlePublish = () => {
    if (!publishCheck.canPublish) return;
    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'nouvelle-experience';
    resetStudio();
    navigate(lovableEventHub(slug));
  };

  return (
    <div className="pb-4">
      <RoleContextBar location="Studio · Créer" />
      <div className="px-6">
        <OrganizerJourneyStrip currentStep={studioStep <= 2 ? 0 : studioStep === 5 ? 2 : 1} compact />

        <PageHeader
          eyebrow={`Studio · ${stepMeta.eyebrow}`}
          title={
            <>
              {stepMeta.title.split(' ')[0]}
              <br />
              <span className="font-serif italic">
                {stepMeta.title.includes(' ')
                  ? stepMeta.title.split(' ').slice(1).join(' ')
                  : stepMeta.hint}
              </span>
            </>
          }
          description={stepMeta.hint}
        />

        <StudioStepper current={studioStep} />

        {studioStep === 1 && (
          <>
            <button
              type="button"
              className="w-full aspect-[16/9] mb-5 rounded-2xl border border-dashed border-border-strong bg-surface flex flex-col items-center justify-center gap-2"
            >
              <Camera className="size-5 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-xs text-muted-foreground">Photo de couverture</span>
            </button>
            <div className="space-y-2 mb-4">
              <StudioField icon={<Tag className="size-4" />} label="Nom de l’expérience">
                <input
                  value={title}
                  onChange={(e) => patchDraft({ title: e.target.value })}
                  className="w-full bg-transparent text-base font-medium outline-none"
                />
              </StudioField>
              <StudioField icon={<Calendar className="size-4" />} label="Date">
                <input
                  value={dateLabel}
                  onChange={(e) => patchDraft({ dateLabel: e.target.value })}
                  className="w-full bg-transparent text-base font-medium outline-none"
                />
              </StudioField>
              <StudioField icon={<MapPin className="size-4" />} label="Lieu">
                <input
                  value={location}
                  onChange={(e) => patchDraft({ location: e.target.value })}
                  className="w-full bg-transparent text-base font-medium outline-none"
                />
              </StudioField>
              <StudioField icon={<AlignLeft className="size-4" />} label="Description">
                <textarea
                  value={draft.description ?? ''}
                  onChange={(e) => patchDraft({ description: e.target.value })}
                  rows={3}
                  className="w-full bg-transparent text-sm outline-none resize-none"
                  placeholder="Décrivez l’expérience en quelques lignes…"
                />
              </StudioField>
            </div>
          </>
        )}

        {studioStep === 2 && (
          <div className="mb-6">
            <p className="eyebrow mb-2">Univers</p>
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface border border-border rounded-xl">
              {(['inviter', 'vendre'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => patchDraft({ universe: u })}
                  className={`py-4 px-2 rounded-lg transition text-left ${
                    universe === u ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <span className="text-xs uppercase tracking-[0.15em] block">
                    {UNIVERSE_COPY[u].title}
                  </span>
                  <span
                    className={`text-[10px] mt-1 block ${universe === u ? 'opacity-80' : 'opacity-70'}`}
                  >
                    {UNIVERSE_COPY[u].badge}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">{copy.subtitle}</p>
          </div>
        )}

        {studioStep === 3 && (
          <div className="space-y-4 mb-6">
            <div>
              <p className="eyebrow mb-2">Visibilité</p>
              <div className="space-y-2">
                {(
                  [
                    { v: 'private' as const, l: 'Privé', d: 'INVITER — liste contrôlée' },
                    { v: 'unlisted' as const, l: 'Non listé', d: 'Lien direct uniquement' },
                    { v: 'public' as const, l: 'Public', d: 'VENDRE — page découverte' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => patchDraft({ visibility: opt.v })}
                    className={`w-full text-left p-4 rounded-xl border ${
                      draft.visibility === opt.v
                        ? 'bg-surface-2 border-border-strong'
                        : 'bg-surface border-border'
                    }`}
                  >
                    <p className="text-sm font-medium">{opt.l}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{opt.d}</p>
                  </button>
                ))}
              </div>
            </div>
            <StudioField icon={<Tag className="size-4" />} label="Capacité (places)">
              <input
                type="number"
                min={1}
                value={draft.capacity ?? 100}
                onChange={(e) => patchDraft({ capacity: Number(e.target.value) || 0 })}
                className="w-full bg-transparent text-base font-medium outline-none font-mono"
              />
            </StudioField>
            <p className="text-[10px] text-muted-foreground">
              Paiements, Stripe et retraits — hors scope Phase 2.
            </p>
          </div>
        )}

        {studioStep === 4 && (
          <DesignEnginePreview
            universe={universe}
            eventTitle={title || 'Votre expérience'}
            eventId="studio-draft"
            description={draft.description}
            dateLabel={dateLabel}
            location={location}
            showToneControls
          />
        )}

        {studioStep === 5 && (
          <div className="mb-6">
            <p className="eyebrow mb-3">Récapitulatif</p>
            <EventCard title={title} date={dateLabel} location={location} tag={copy.badge} />
            {!publishCheck.canPublish && (
              <ul className="mt-4 space-y-1 text-xs text-destructive">
                {publishCheck.blockers.map((b) => (
                  <li key={b}>{PUBLICATION_BLOCKER_LABELS[b] ?? b}</li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              La publication met l’expérience en statut <strong>Publié</strong>. Pilotage complet
              depuis le centre de contrôle.
            </p>
          </div>
        )}

        {studioStep < 4 && (
          <>
            <p className="eyebrow mt-4 mb-3">Aperçu</p>
            <EventCard title={title} date={dateLabel} location={location} tag={copy.badge} />
          </>
        )}

        <div className="flex gap-2 mt-6">
          {studioStep > 1 ? (
            <button
              type="button"
              onClick={goBack}
              className="flex-1 py-4 border border-border rounded-2xl text-sm text-muted-foreground"
            >
              Retour
            </button>
          ) : (
            <Link
              to={LOVABLE_ROUTES.accueil}
              className="flex-1 py-4 border border-border rounded-2xl text-sm text-center text-muted-foreground"
            >
              Annuler
            </Link>
          )}
          {studioStep < STUDIO_STEPS ? (
            <button
              type="button"
              onClick={goNext}
              className="flex-[2] py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-medium flex items-center justify-center gap-2"
            >
              Continuer
              <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={!publishCheck.canPublish}
              onClick={handlePublish}
              className="flex-[2] py-4 bg-primary text-primary-foreground rounded-2xl text-sm font-medium disabled:opacity-40"
            >
              Publier l’expérience
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StudioField({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-4 p-4 bg-surface border border-border rounded-xl">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
          {label}
        </div>
        {children}
      </div>
    </label>
  );
}
