import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/roles';
import { ROUTES } from '@/lib/constants';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

/**
 * Route guard — renders Outlet only. No UI styling.
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div data-invora="auth-loading" aria-busy="true" />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.auth} state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <Outlet />;
}
