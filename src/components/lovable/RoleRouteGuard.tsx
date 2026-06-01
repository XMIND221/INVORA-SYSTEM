import { Navigate, useLocation } from 'react-router-dom';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { isPathAllowed } from '@/integration/lovable/navigation';
import { useRole } from '@/integration/lovable/use-role';

/** Redirige vers l'accueil si le rôle n'a pas accès à la route (alignement UX Phase 1). */
export function RoleRouteGuard({ children }: { children: React.ReactNode }) {
  const role = useRole();
  const { pathname } = useLocation();

  if (!isPathAllowed(role, pathname)) {
    return <Navigate to={LOVABLE_ROUTES.accueil} replace />;
  }

  return children;
}
