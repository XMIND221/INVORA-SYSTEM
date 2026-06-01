import { lazy, Suspense, type ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import { LovableAppLayout } from '@/layouts/LovableAppLayout';
import { LOVABLE_ROUTES } from '@/lib/constants';
import { registerLovableManifest } from './registry';

const WelcomePage = lazy(() => import('@/pages/lovable/WelcomePage'));
const AccueilPage = lazy(() => import('@/pages/lovable/AccueilPage'));
const EvenementsPage = lazy(() => import('@/pages/lovable/EvenementsPage'));
const CreerPage = lazy(() => import('@/pages/lovable/CreerPage'));
const AccesPage = lazy(() => import('@/pages/lovable/AccesPage'));
const ScannerPage = lazy(() => import('@/pages/lovable/ScannerPage'));
const ParcoursPage = lazy(() => import('@/pages/lovable/ParcoursPage'));
const PartenairesPage = lazy(() => import('@/pages/lovable/PartenairesPage'));
const ParametresPage = lazy(() => import('@/pages/lovable/ParametresPage'));

function PageFallback() {
  return <div className="min-h-screen bg-background" aria-busy="true" />;
}

const wrap = (el: ReactNode) => (
  <Suspense fallback={<PageFallback />}>{el}</Suspense>
);

export const lovableRoutes: RouteObject[] = [
  {
    path: LOVABLE_ROUTES.root,
    element: wrap(<WelcomePage />),
  },
  {
    element: wrap(<LovableAppLayout />),
    children: [
      { path: LOVABLE_ROUTES.accueil, element: <AccueilPage /> },
      { path: LOVABLE_ROUTES.evenements, element: <EvenementsPage /> },
      { path: LOVABLE_ROUTES.creer, element: <CreerPage /> },
      { path: LOVABLE_ROUTES.acces, element: <AccesPage /> },
      { path: LOVABLE_ROUTES.scanner, element: <ScannerPage /> },
      { path: LOVABLE_ROUTES.parcours, element: <ParcoursPage /> },
      { path: LOVABLE_ROUTES.partenaires, element: <PartenairesPage /> },
      { path: LOVABLE_ROUTES.parametres, element: <ParametresPage /> },
      { path: '/acces', element: <AccesPage /> },
    ],
  },
];

registerLovableManifest({
  version: '1.0.0-phase1',
  routes: lovableRoutes,
});
