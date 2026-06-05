import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { Stat } from '@/components/lovable/Stat';
import { LoadingPage, NetworkErrorState, PermissionDeniedState } from '@/components/lovable/ui-states';
import { PRODUCT_VOCABULARY } from '@/integration/lovable/product-vocabulary';
import { useAuth } from '@/hooks/useAuth';
import { useOrganizerEvents } from '@/hooks/useOrganizerEvents';

const sections = [
  {
    label: PRODUCT_VOCABULARY.primarySections.experiences,
    description: 'Piloter les experiences existantes.',
    to: LOVABLE_ROUTES.evenements,
  },
  {
    label: PRODUCT_VOCABULARY.primarySections.wallet,
    description: 'Retrouver billets, invitations et acces.',
    to: LOVABLE_ROUTES.acces,
  },
  {
    label: PRODUCT_VOCABULARY.primarySections.settings,
    description: 'Gerer le profil et les preferences.',
    to: LOVABLE_ROUTES.parametres,
  },
] as const;

export default function AccountDashboardPage() {
  const { profile, isAuthenticated, isLoading: authLoading } = useAuth();
  const { events, isLoading, isError, error, refetch } = useOrganizerEvents();

  if (authLoading || isLoading) {
    return (
      <div className="pb-4">
        <RoleContextBar location={PRODUCT_VOCABULARY.primarySections.dashboard} />
        <LoadingPage />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="pb-4">
        <RoleContextBar location={PRODUCT_VOCABULARY.primarySections.dashboard} />
        <PermissionDeniedState />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="pb-4">
        <RoleContextBar location={PRODUCT_VOCABULARY.primarySections.dashboard} />
        <NetworkErrorState message={error?.message ?? 'Erreur'} onRetry={() => void refetch()} />
      </div>
    );
  }

  const displayName = profile?.full_name?.split(' ')[0] ?? 'Compte';
  const publishedCount = events.filter((event) => event.status === 'published').length;
  const totalScans = events.reduce((sum, event) => sum + event.metrics.scans, 0);

  return (
    <div className="pb-4">
      <RoleContextBar location={PRODUCT_VOCABULARY.primarySections.dashboard} />
      <div className="px-6">
        <PageHeader
          eyebrow={PRODUCT_VOCABULARY.appName}
          title={
            <>
              Tableau
              <br />
              <span className="font-serif italic">de bord.</span>
            </>
          }
          description={`Bonjour ${displayName}. Retrouvez les entrees principales sans modifier vos flux existants.`}
        />

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Stat label="Experiences" value={String(events.length)} />
          <Stat label="Publiees" value={String(publishedCount)} />
          <Stat label="Scans" value={String(totalScans)} />
        </div>

        <div className="space-y-3">
          {sections.map((section) => (
            <Link
              key={section.to}
              to={section.to}
              className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4 transition hover:border-border-strong"
            >
              <span>
                <span className="block text-sm font-medium">{section.label}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{section.description}</span>
              </span>
              <ArrowUpRight className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
