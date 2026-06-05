import { Navigate, useLocation } from 'react-router-dom';
import { LOVABLE_ROUTES } from '@/lib/constants';

interface LegacyRouteRedirectsProps {
  to?: string;
  preserveSearch?: boolean;
}

export function LegacyRouteRedirects({
  to = LOVABLE_ROUTES.accueil,
  preserveSearch = false,
}: LegacyRouteRedirectsProps) {
  const location = useLocation();
  const target = preserveSearch ? `${to}${location.search}` : to;

  return <Navigate to={target} replace state={{ legacyFrom: location.pathname }} />;
}
