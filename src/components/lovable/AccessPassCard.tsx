import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { ACCESS_STATUS_LABEL, publicLinkForAccess } from '@/features/engines/access.engine';
import { lovableWalletAccess } from '@/lib/constants';
import type { InvoraAccess } from '@/types/access';

export function AccessPassCard({ access }: { access: InvoraAccess }) {
  return (
    <li className="p-4 bg-surface border border-border rounded-xl">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-sm font-medium">{access.eventTitle}</p>
        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {ACCESS_STATUS_LABEL[access.status]}
        </span>
      </div>
      <p className="font-mono text-[10px] text-muted-foreground">
        {access.holderName} · {access.accessTypeLabel} · {access.accessCode}
      </p>
      <div className="flex items-center justify-between mt-3">
        <Link
          to={lovableWalletAccess(access.accessId)}
          className="text-[10px] uppercase tracking-[0.2em] text-primary"
        >
          Fiche accès
        </Link>
        <a href={publicLinkForAccess(access)} className="text-muted-foreground">
          <Download className="size-3.5" />
        </a>
      </div>
    </li>
  );
}
