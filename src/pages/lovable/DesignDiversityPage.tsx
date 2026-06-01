import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { LUXURY_DESIGN_COPY } from '@/integration/lovable/product-copy';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { designService } from '@/services/design.service';

export default function DesignDiversityPage() {
  const report = designService.diversityReport();

  return (
    <div className="pb-4">
      <RoleContextBar location="Tests diversité" />
      <div className="px-6">
        <Link
          to={LOVABLE_ROUTES.evenements}
          className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-4 inline-block"
        >
          Retour événements
        </Link>
        <PageHeader
          eyebrow="Phase 8 · QA"
          title="Diversité design"
          description={LUXURY_DESIGN_COPY.diversityDesc}
        />
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border mb-6 ${
            report.passed ? 'border-[color:var(--color-success)]' : 'border-destructive'
          }`}
        >
          {report.passed ? (
            <Check className="size-5 text-[color:var(--color-success)]" />
          ) : (
            <X className="size-5 text-destructive" />
          )}
          <div>
            <p className="font-medium">
              {report.uniqueFingerprints} / {report.total} identités uniques
            </p>
            <p className="text-xs text-muted-foreground">
              {report.passed ? 'Aucun doublon détecté.' : 'Collision fingerprint — ajuster le moteur.'}
            </p>
          </div>
        </div>
        <ul className="space-y-1 max-h-[60vh] overflow-y-auto">
          {report.samples.map((s) => (
            <li
              key={s.fingerprint}
              className="flex justify-between gap-2 py-2 border-b border-border text-xs"
            >
              <span className="truncate">{s.title}</span>
              <span className="font-mono text-muted-foreground shrink-0">{s.collectionId}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
