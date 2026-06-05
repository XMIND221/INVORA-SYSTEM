import { lazy, Suspense, type ReactNode } from 'react';
import type { RouteObject } from 'react-router-dom';
import { LegacyRouteRedirects } from '@/components/lovable/LegacyRouteRedirects';
import { LovableAppLayout } from '@/layouts/LovableAppLayout';
import { LOVABLE_ROUTES, ROUTES } from '@/lib/constants';
import { registerLovableManifest } from './registry';

const WelcomePage = lazy(() => import('@/pages/lovable/WelcomePage'));
const AuthPage = lazy(() => import('@/pages/lovable/AuthPage'));
const AccountDashboardPage = lazy(() => import('@/pages/lovable/AccountDashboardPage'));
const AccueilPage = lazy(() => import('@/pages/lovable/AccueilPage'));
const EvenementsPage = lazy(() => import('@/pages/lovable/EvenementsPage'));
const CreerPage = lazy(() => import('@/pages/lovable/CreerPage'));
const CustomerCrmPage = lazy(() => import('@/pages/lovable/CustomerCrmPage'));
const CustomerDetailPage = lazy(() => import('@/pages/lovable/CustomerDetailPage'));
const AccesPage = lazy(() => import('@/pages/lovable/AccesPage'));
const ScannerPage = lazy(() => import('@/pages/lovable/ScannerPage'));
const ParcoursPage = lazy(() => import('@/pages/lovable/ParcoursPage'));
const PartenairesPage = lazy(() => import('@/pages/lovable/PartenairesPage'));
const ParametresPage = lazy(() => import('@/pages/lovable/ParametresPage'));
const EventHubPage = lazy(() => import('@/pages/lovable/EventHubPage'));
const EventAnalyticsPage = lazy(() => import('@/pages/lovable/EventAnalyticsPage'));
const ExperienceAnalyticsPage = lazy(() => import('@/pages/lovable/ExperienceAnalyticsPage'));
const EventRayonnerPage = lazy(() => import('@/pages/lovable/EventRayonnerPage'));
const EventMediasPage = lazy(() => import('@/pages/lovable/EventMediasPage'));
const InviterHubPage = lazy(() => import('@/pages/lovable/InviterHubPage'));
const InviterGuestsPage = lazy(() => import('@/pages/lovable/InviterGuestsPage'));
const InviterDistributePage = lazy(() => import('@/pages/lovable/InviterDistributePage'));
const InviterAnalyticsPage = lazy(() => import('@/pages/lovable/InviterAnalyticsPage'));
const InvitePublicPage = lazy(() => import('@/pages/lovable/InvitePublicPage'));
const VendreHubPage = lazy(() => import('@/pages/lovable/VendreHubPage'));
const VendreTicketsPage = lazy(() => import('@/pages/lovable/VendreTicketsPage'));
const VendrePublishPage = lazy(() => import('@/pages/lovable/VendrePublishPage'));
const VendreAnalyticsPage = lazy(() => import('@/pages/lovable/VendreAnalyticsPage'));
const VendreRayonnerPage = lazy(() => import('@/pages/lovable/VendreRayonnerPage'));
const PublicTicketingPage = lazy(() => import('@/pages/lovable/PublicTicketingPage'));
const TicketPurchasePage = lazy(() => import('@/pages/lovable/TicketPurchasePage'));
const TicketPublicPage = lazy(() => import('@/pages/lovable/TicketPublicPage'));
const PartnerCampaignPage = lazy(() => import('@/pages/lovable/PartnerCampaignPage'));
const PartnerWalletPage = lazy(() => import('@/pages/lovable/PartnerWalletPage'));
const PartnerWithdrawalsPage = lazy(() => import('@/pages/lovable/PartnerWithdrawalsPage'));
const PartnerAnalyticsPage = lazy(() => import('@/pages/lovable/PartnerAnalyticsPage'));
const PartnerRayonnerPage = lazy(() => import('@/pages/lovable/PartnerRayonnerPage'));
const PartnerRedirectPage = lazy(() => import('@/pages/lovable/PartnerRedirectPage'));
const ScannerHistoryPage = lazy(() => import('@/pages/lovable/ScannerHistoryPage'));
const ScannerAnalyticsPage = lazy(() => import('@/pages/lovable/ScannerAnalyticsPage'));
const ScannerSearchPage = lazy(() => import('@/pages/lovable/ScannerSearchPage'));
const AccessDetailPage = lazy(() => import('@/pages/lovable/AccessDetailPage'));
const WalletHistoryPage = lazy(() => import('@/pages/lovable/WalletHistoryPage'));
const WalletAnalyticsPage = lazy(() => import('@/pages/lovable/WalletAnalyticsPage'));
const WalletSearchPage = lazy(() => import('@/pages/lovable/WalletSearchPage'));
const DesignStudioPage = lazy(() => import('@/pages/lovable/DesignStudioPage'));
const DesignDiversityPage = lazy(() => import('@/pages/lovable/DesignDiversityPage'));
const OrganizerFinancePage = lazy(() => import('@/pages/lovable/OrganizerFinancePage'));
const FinanceReportsPage = lazy(() => import('@/pages/lovable/FinanceReportsPage'));
const InviterPricingPage = lazy(() => import('@/pages/lovable/InviterPricingPage'));
const CheckoutPage = lazy(() => import('@/pages/lovable/CheckoutPage'));
const PaymentStatusPage = lazy(() => import('@/pages/lovable/PaymentStatusPage'));

function PageFallback() {
  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 text-muted-foreground"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="size-8 rounded-full border border-border border-t-foreground animate-spin" />
      <p className="text-sm">Chargement…</p>
    </div>
  );
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
    path: ROUTES.auth,
    element: wrap(<AuthPage />),
  },
  {
    path: ROUTES.dashboard,
    element: wrap(<AccountDashboardPage />),
  },
  {
    path: '/u/inviter',
    element: <LegacyRouteRedirects to={LOVABLE_ROUTES.accueil} preserveSearch />,
  },
  {
    path: '/u/vendre',
    element: <LegacyRouteRedirects to={LOVABLE_ROUTES.accueil} preserveSearch />,
  },
  {
    path: '/invite/:token',
    element: wrap(<InvitePublicPage />),
  },
  { path: '/billetterie/:eventId', element: wrap(<PublicTicketingPage />) },
  { path: '/billetterie/:eventId/acheter', element: wrap(<TicketPurchasePage />) },
  { path: '/checkout/:attemptId', element: wrap(<CheckoutPage />) },
  { path: '/paiement/statut/:attemptId', element: wrap(<PaymentStatusPage />) },
  { path: '/ticket/:token', element: wrap(<TicketPublicPage />) },
  { path: '/p/:partnerCode/:eventId', element: wrap(<PartnerRedirectPage />) },
  {
    element: wrap(<LovableAppLayout />),
    children: [
      { path: LOVABLE_ROUTES.accueil, element: <AccueilPage /> },
      { path: LOVABLE_ROUTES.evenements, element: <EvenementsPage /> },
      { path: `${LOVABLE_ROUTES.evenements}/:eventId`, element: <EventHubPage /> },
      { path: `${LOVABLE_ROUTES.evenements}/:eventId/analytics`, element: <EventAnalyticsPage /> },
      {
        path: `${LOVABLE_ROUTES.evenements}/:eventId/experience-analytics`,
        element: <ExperienceAnalyticsPage />,
      },
      { path: `${LOVABLE_ROUTES.evenements}/:eventId/rayonner`, element: <EventRayonnerPage /> },
      { path: `${LOVABLE_ROUTES.evenements}/:eventId/medias`, element: <EventMediasPage /> },
      { path: `${LOVABLE_ROUTES.evenements}/:eventId/design`, element: <DesignStudioPage /> },
      { path: '/design/diversity', element: <DesignDiversityPage /> },
      { path: `${LOVABLE_ROUTES.evenements}/:eventId/inviter`, element: <InviterHubPage /> },
      { path: `${LOVABLE_ROUTES.evenements}/:eventId/inviter/guests`, element: <InviterGuestsPage /> },
      {
        path: `${LOVABLE_ROUTES.evenements}/:eventId/inviter/distribuer`,
        element: <InviterDistributePage />,
      },
      {
        path: `${LOVABLE_ROUTES.evenements}/:eventId/inviter/analytics`,
        element: <InviterAnalyticsPage />,
      },
      {
        path: `${LOVABLE_ROUTES.evenements}/:eventId/inviter/tarifs`,
        element: <InviterPricingPage />,
      },
      { path: `${LOVABLE_ROUTES.evenements}/:eventId/vendre`, element: <VendreHubPage /> },
      { path: `${LOVABLE_ROUTES.evenements}/:eventId/vendre/billets`, element: <VendreTicketsPage /> },
      { path: `${LOVABLE_ROUTES.evenements}/:eventId/vendre/publier`, element: <VendrePublishPage /> },
      {
        path: `${LOVABLE_ROUTES.evenements}/:eventId/vendre/analytics`,
        element: <VendreAnalyticsPage />,
      },
      { path: `${LOVABLE_ROUTES.evenements}/:eventId/vendre/rayonner`, element: <VendreRayonnerPage /> },
      { path: LOVABLE_ROUTES.creer, element: <CreerPage /> },
      { path: LOVABLE_ROUTES.crm, element: <CustomerCrmPage /> },
      { path: `${LOVABLE_ROUTES.crm}/:customerId`, element: <CustomerDetailPage /> },
      { path: LOVABLE_ROUTES.acces, element: <AccesPage /> },
      { path: `${LOVABLE_ROUTES.acces}/:accessId`, element: <AccessDetailPage /> },
      { path: `${LOVABLE_ROUTES.acces}/historique`, element: <WalletHistoryPage /> },
      { path: `${LOVABLE_ROUTES.acces}/analytics`, element: <WalletAnalyticsPage /> },
      { path: `${LOVABLE_ROUTES.acces}/recherche`, element: <WalletSearchPage /> },
      { path: LOVABLE_ROUTES.scanner, element: <ScannerPage /> },
      { path: `${LOVABLE_ROUTES.scanner}/historique`, element: <ScannerHistoryPage /> },
      { path: `${LOVABLE_ROUTES.scanner}/analytics`, element: <ScannerAnalyticsPage /> },
      { path: `${LOVABLE_ROUTES.scanner}/recherche`, element: <ScannerSearchPage /> },
      { path: LOVABLE_ROUTES.parcours, element: <ParcoursPage /> },
      { path: LOVABLE_ROUTES.partenaires, element: <PartenairesPage /> },
      { path: `${LOVABLE_ROUTES.partenaires}/campagnes/:campaignId`, element: <PartnerCampaignPage /> },
      { path: `${LOVABLE_ROUTES.partenaires}/wallet`, element: <PartnerWalletPage /> },
      { path: `${LOVABLE_ROUTES.partenaires}/retraits`, element: <PartnerWithdrawalsPage /> },
      { path: `${LOVABLE_ROUTES.partenaires}/analytics`, element: <PartnerAnalyticsPage /> },
      { path: `${LOVABLE_ROUTES.partenaires}/rayonner/:eventId`, element: <PartnerRayonnerPage /> },
      { path: LOVABLE_ROUTES.finance, element: <OrganizerFinancePage /> },
      { path: `${LOVABLE_ROUTES.finance}/rapports`, element: <FinanceReportsPage /> },
      { path: LOVABLE_ROUTES.parametres, element: <ParametresPage /> },
      { path: '/acces', element: <AccesPage /> },
    ],
  },
];

registerLovableManifest({
  version: '11.0.0-phase11f-notifications-engine',
  routes: lovableRoutes,
});
