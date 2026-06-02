import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import {
  LOVABLE_ROUTES,
  lovableEventAnalytics,
  lovableEventHub,
  lovableFinance,
  lovableScannerAnalytics,
  lovableScannerHistory,
} from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { Stat } from '@/components/lovable/Stat';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { NextActionCard } from '@/components/lovable/NextActionCard';
import { UniverseCard } from '@/components/lovable/UniverseCard';
import { OrganizerJourneyStrip } from '@/components/lovable/OrganizerJourneyStrip';
import { ROLE_INTENT, WALLET_COPY } from '@/integration/lovable/product-copy';
import { useRole } from '@/integration/lovable/use-role';
import { useOrganizerEvents } from '@/hooks/useOrganizerEvents';
import { useAuth } from '@/hooks/useAuth';
import {
  EmptyState,
  LoadingPage,
  NetworkErrorState,
  PermissionDeniedState,
} from '@/components/lovable/ui-states';

export default function AccueilPage() {
  const role = useRole();
  if (role === 'participant') return <InviteHome />;
  if (role === 'partenaire') return <PartnerHome />;
  if (role === 'scanner') return <ScannerHome />;
  return <OrganizerHome />;
}

function OrganizerHome() {
  const intent = ROLE_INTENT.organisateur;
  const { profile, isAuthenticated, isLoading: authLoading } = useAuth();
  const { events, isLoading, isError, error, refetch } = useOrganizerEvents();

  const flagship = events[0];
  const inviterEvent = events.find((e) => e.universe === 'inviter');
  const vendreEvent = events.find((e) => e.universe === 'vendre');
  const totalScans = events.reduce((s, e) => s + e.metrics.scans, 0);
  const totalRevenue = events.reduce((s, e) => s + e.metrics.revenueEur, 0);
  const displayName = profile?.full_name?.split(' ')[0] ?? 'Organisateur';

  if (authLoading || isLoading) {
    return (
      <div className="pb-4">
        <RoleContextBar location="Tableau de bord" />
        <LoadingPage />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="pb-4">
        <RoleContextBar location="Tableau de bord" />
        <PermissionDeniedState />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="pb-4">
        <RoleContextBar location="Tableau de bord" />
        <NetworkErrorState message={error?.message ?? 'Erreur'} onRetry={() => void refetch()} />
      </div>
    );
  }

  return (
    <div className="pb-4">
      <RoleContextBar location="Tableau de bord" />
      <div className="px-6">
        <PageHeader
          eyebrow={intent.label}
          title={
            <>
              Bonjour,
              <br />
              <span className="font-serif italic">{displayName}.</span>
            </>
          }
          description="Créer · Configurer · Publier · Gérer · Analyser — sans vous perdre."
        />

        {events.length === 0 ? (
          <EmptyState
            title="Aucune expérience"
            description="Créez et publiez votre première expérience. Elle sera stockée dans Supabase."
            ctaLabel="Créer"
            ctaTo={LOVABLE_ROUTES.creer}
          />
        ) : (
          <>
            <OrganizerJourneyStrip currentStep={flagship?.journeyStep ?? 0} />

            {flagship ? (
              <NextActionCard
                title="Piloter votre expérience"
                description={`${flagship.title} · ${flagship.universe === 'inviter' ? 'INVITER' : 'VENDRE'}`}
                to={lovableEventHub(flagship.id)}
                cta="Ouvrir le pilotage"
              />
            ) : null}

            <p className="eyebrow mb-3">Vos univers</p>
            <UniverseCard
              universe="inviter"
              currentStep={inviterEvent?.universeFlowStep ?? 0}
              eventId={inviterEvent?.id}
            />
            <UniverseCard
              universe="vendre"
              currentStep={vendreEvent?.universeFlowStep ?? 0}
              eventId={vendreEvent?.id}
            />
          </>
        )}

        <Link
          to={LOVABLE_ROUTES.creer}
          className="flex items-center justify-center gap-2 w-full py-3 mt-2 mb-4 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition"
        >
          Créer une nouvelle expérience
          <ArrowUpRight className="size-4" />
        </Link>

        {flagship ? (
          <Link
            to={lovableEventAnalytics(flagship.id)}
            className="block text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2"
          >
            Analytics · {flagship.title}
          </Link>
        ) : null}
        <Link
          to={lovableFinance()}
          className="block text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-6"
        >
          Finance · solde & retraits
        </Link>

        {events.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 py-4 border-t border-border">
            <Stat
              label="Revenus"
              value={totalRevenue > 0 ? `${(totalRevenue / 1000).toFixed(1)}k€` : '—'}
            />
            <Stat label="Événements" value={String(events.length)} />
            <Stat label="Scans" value={String(totalScans)} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function InviteHome() {
  const intent = ROLE_INTENT.participant;

  return (
    <div className="pb-4">
      <RoleContextBar location="Accueil invité" />
      <div className="px-6">
        <PageHeader
          eyebrow={intent.label}
          title={
            <>
              Vos accès,
              <br />
              <span className="font-serif italic">au même endroit.</span>
            </>
          }
          description={intent.youGet}
        />

        <NextActionCard
          title={WALLET_COPY.title}
          description="Soirée Velours · QR prêt à l’entrée — compte non requis"
          to={LOVABLE_ROUTES.acces}
          cta="Ouvrir mon portefeuille"
        />

        <p className="text-xs text-muted-foreground p-4 bg-surface border border-border rounded-xl">
          {WALLET_COPY.notARole}
        </p>
      </div>
    </div>
  );
}

function PartnerHome() {
  const intent = ROLE_INTENT.partenaire;

  return (
    <div className="pb-4">
      <RoleContextBar location="Accueil partenaire" />
      <div className="px-6">
        <PageHeader
          eyebrow={intent.label}
          title={
            <>
              840,50€
              <br />
              <span className="font-serif italic">à retirer.</span>
            </>
          }
          description={intent.nextHint}
        />

        <NextActionCard
          title="Campagne Showcase 06"
          description="Media kit · lien traçable · commissions VENDRE"
          to="/partenaires/campagnes/pc-showcase"
          cta="Promouvoir"
        />

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Ce mois" value="1 240€" />
          <Stat label="Ventes" value="38" />
        </div>
      </div>
    </div>
  );
}

function ScannerHome() {
  const intent = ROLE_INTENT.scanner;

  return (
    <div className="pb-4">
      <RoleContextBar location="Contrôle d'accès" />
      <div className="px-6">
        <PageHeader
          eyebrow={intent.label}
          title={
            <>
              Prêt à
              <br />
              <span className="font-serif italic">scanner.</span>
            </>
          }
          description={intent.youGet}
        />

        <NextActionCard
          title="Lancer le scan"
          description="Obsidian Gala · Porte A · validation et refus en direct"
          to={LOVABLE_ROUTES.scanner}
          cta="Ouvrir le scanner"
        />

        <div className="grid grid-cols-3 gap-3 py-4 border-t border-border">
          <Stat label="Validés" value="218" />
          <Stat label="Refusés" value="3" />
          <Stat label="Total" value="221" />
        </div>

        <div className="flex gap-4 justify-center mt-4 text-[10px] uppercase tracking-[0.18em]">
          <Link to={lovableScannerHistory()} className="text-muted-foreground hover:text-foreground">
            Historique
          </Link>
          <Link to={lovableScannerAnalytics()} className="text-muted-foreground hover:text-foreground">
            Analytics terrain
          </Link>
        </div>
      </div>
    </div>
  );
}
