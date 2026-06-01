import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { guestDisplayName } from '@/features/engines/scanner.engine';
import { SCANNER_ENGINE_COPY } from '@/integration/lovable/product-copy';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { scannerService } from '@/services/scanner.service';
import type { ScannerSearchHit } from '@/types/scanner';

export default function ScannerSearchPage() {
  const session = scannerService.getSession();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<ScannerSearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const results = await scannerService.search(session.eventId, query);
      setHits(results);
    } finally {
      setLoading(false);
    }
  }

  async function validateHit(hit: ScannerSearchHit) {
    await scannerService.validateScan({
      eventId: session.eventId,
      passReference: hit.passReference,
      gateCode: session.gateCode,
    });
  }

  return (
    <div className="pb-4">
      <RoleContextBar location="Recherche manuelle" />
      <div className="px-6">
        <Link
          to={LOVABLE_ROUTES.scanner}
          className="inline-flex items-center gap-2 text-xs text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3.5" />
          Scanner
        </Link>
        <PageHeader
          eyebrow={session.eventTitle}
          title="Recherche"
          description={SCANNER_ENGINE_COPY.searchDesc}
        />
        <form onSubmit={onSearch} className="flex gap-2 mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom, téléphone, email, code…"
            className="flex-1 px-4 py-3 bg-surface border border-border rounded-xl text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 rounded-xl bg-primary text-primary-foreground"
          >
            <Search className="size-4" />
          </button>
        </form>
        <ul className="space-y-2">
          {hits.map((h) => (
            <li key={h.accessId} className="p-4 bg-surface border border-border rounded-xl">
              <p className="font-medium">
                {guestDisplayName(h.firstName ?? '', h.lastName ?? '')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {h.passKind} · {h.accessStatus} · {h.uniqueCode ?? '—'}
              </p>
              <button
                type="button"
                className="mt-3 text-[10px] uppercase tracking-[0.18em] text-primary"
                onClick={() => void validateHit(h)}
              >
                Valider cet accès
              </button>
            </li>
          ))}
        </ul>
        {hits.length === 0 && query && !loading && (
          <p className="text-sm text-muted-foreground text-center">{SCANNER_ENGINE_COPY.noResults}</p>
        )}
      </div>
    </div>
  );
}
