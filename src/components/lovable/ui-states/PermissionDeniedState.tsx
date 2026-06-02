import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';

export function PermissionDeniedState({
  description = 'Connectez-vous avec un compte organisateur pour continuer.',
}: {
  description?: string;
}) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-6 text-center">
      <p className="eyebrow mb-2">Accès refusé</p>
      <h2 className="font-serif italic text-2xl">Connexion requise</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-xs">{description}</p>
      <Link
        to={ROUTES.auth}
        className="mt-6 inline-flex px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm"
      >
        Se connecter
      </Link>
    </div>
  );
}
