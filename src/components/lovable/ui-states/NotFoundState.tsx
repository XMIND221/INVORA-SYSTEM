import { Link } from 'react-router-dom';
import { LOVABLE_ROUTES } from '@/lib/constants';

export function NotFoundState({
  title = 'Introuvable',
  description = 'Cet élément n’existe pas ou a été supprimé.',
  backTo = LOVABLE_ROUTES.evenements,
  backLabel = 'Mes événements',
}: {
  title?: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
}) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow mb-2">404</p>
      <h2 className="font-serif italic text-2xl">{title}</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-xs">{description}</p>
      <Link
        to={backTo}
        className="mt-6 inline-flex px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm"
      >
        {backLabel}
      </Link>
    </div>
  );
}
