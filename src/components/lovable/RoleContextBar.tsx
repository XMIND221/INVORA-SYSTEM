import { Link } from 'react-router-dom';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { ROLE_INTENT } from '@/integration/lovable/product-copy';
import { useRole } from '@/integration/lovable/use-role';

export function RoleContextBar({ location }: { location?: string }) {
  const role = useRole();
  const intent = ROLE_INTENT[role];

  return (
    <div className="px-6 pt-8 pb-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow truncate">
            {intent.label}
            {location ? ` · ${location}` : ''}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1 truncate">{intent.youAre}</p>
        </div>
        <Link
          to={LOVABLE_ROUTES.parametres}
          className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
        >
          Profil
        </Link>
      </div>
    </div>
  );
}
