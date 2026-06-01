import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { PageHeader } from '@/components/lovable/PageHeader';
import { Stat } from '@/components/lovable/Stat';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { NextActionCard } from '@/components/lovable/NextActionCard';
import { UniverseCard } from '@/components/lovable/UniverseCard';
import { ROLE_INTENT, WALLET_COPY } from '@/integration/lovable/product-copy';
import { useRole } from '@/integration/lovable/use-role';

export default function AccueilPage() {
  const role = useRole();
  if (role === 'participant') return <InviteHome />;
  if (role === 'partenaire') return <PartnerHome />;
  if (role === 'scanner') return <ScannerHome />;
  return <OrganizerHome />;
}

function OrganizerHome() {
  const intent = ROLE_INTENT.organisateur;

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
              <span className="font-serif italic">Marc.</span>
            </>
          }
          description={intent.nextHint}
        />

        <NextActionCard
          title="Distribuer vos invitations"
          description="Obsidian Gala · univers INVITER · étape 3 sur 5"
          to={`${LOVABLE_ROUTES.parcours}?univers=inviter`}
          cta="Voir le parcours"
        />

        <p className="eyebrow mb-3">Vos deux univers</p>
        <UniverseCard universe="inviter" currentStep={2} />
        <UniverseCard universe="vendre" currentStep={0} />

        <Link
          to={LOVABLE_ROUTES.creer}
          className="flex items-center justify-center gap-2 w-full py-3 mt-2 mb-6 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground transition"
        >
          Créer une nouvelle expérience
          <ArrowUpRight className="size-4" />
        </Link>

        <div className="grid grid-cols-3 gap-3 py-4 border-t border-border">
          <Stat label="Revenus" value="12.4k€" />
          <Stat label="Vendus" value="482" />
          <Stat label="Scans" value="92%" />
        </div>
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
          title="Partager vos liens actifs"
          description="2 événements · stories et visuels prêts dans Promouvoir"
          to={LOVABLE_ROUTES.partenaires}
          cta="Aller à Promouvoir"
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
      </div>
    </div>
  );
}
