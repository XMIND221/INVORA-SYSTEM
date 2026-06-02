import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { AccessPassCard } from '@/components/lovable/AccessPassCard';
import { PageHeader } from '@/components/lovable/PageHeader';
import { RoleContextBar } from '@/components/lovable/RoleContextBar';
import { WALLET_ENGINE_COPY } from '@/integration/lovable/product-copy';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { accessService } from '@/services/access.service';
import { useAuth } from '@/hooks/useAuth';

export default function WalletSearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Awaited<ReturnType<typeof accessService.search>>>([]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id || !query.trim()) {
      setHits([]);
      return;
    }
    const results = await accessService.search(query, user.id);
    setHits(results);
  }

  return (
    <div className="pb-4">
      <RoleContextBar location="Recherche wallet" />
      <div className="px-6">
        <Link
          to={LOVABLE_ROUTES.acces}
          className="inline-flex items-center gap-2 text-xs text-muted-foreground mb-4"
        >
          <ArrowLeft className="size-3.5" />
          Wallet
        </Link>
        <PageHeader eyebrow="Wallet" title="Recherche" description={WALLET_ENGINE_COPY.searchDesc} />
        <form onSubmit={(e) => void onSubmit(e)} className="flex gap-2 mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nom, téléphone, code…"
            className="flex-1 p-3 border border-border rounded-lg bg-surface text-sm"
          />
          <button
            type="submit"
            className="px-4 py-3 bg-primary text-primary-foreground rounded-lg"
            aria-label="Rechercher"
          >
            <Search className="size-4" />
          </button>
        </form>
        <ul className="space-y-3">
          {hits.map((a) => (
            <AccessPassCard key={`${a.universe}-${a.accessId}`} access={a} />
          ))}
        </ul>
      </div>
    </div>
  );
}
