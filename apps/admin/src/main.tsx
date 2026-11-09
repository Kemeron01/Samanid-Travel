import '@fontsource-variable/manrope';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, Suspense, lazy, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import i18n from '@/lib/i18n';
import { SessionProvider } from '@/lib/session';
import { ToastProvider } from '@/lib/ui';
import { Guard, Home, NotFound } from '@/components/Guard';
import { Shell } from '@/components/Shell';
import { LoginPage, TwoFactorPage } from '@/pages/Login';
import { SecurityIndex } from '@/components/Guard';
import './styles.css';

/** Код-сплиттинг по маршрутам: тяжёлые экраны (Recharts, TanStack Table) грузятся по требованию. */
function lazyNamed<M, K extends keyof M>(load: () => Promise<M>, name: K) {
  return lazy(async () => ({ default: (await load())[name] as M[K] & ComponentType<any> })); // eslint-disable-line @typescript-eslint/no-explicit-any
}
const DashboardPage = lazyNamed(() => import('@/pages/Dashboard'), 'DashboardPage');
const OrdersPage = lazyNamed(() => import('@/pages/Orders'), 'OrdersPage');
const CustomersPage = lazyNamed(() => import('@/pages/Customers'), 'CustomersPage');
const PaymentsPage = lazyNamed(() => import('@/pages/Customers'), 'PaymentsPage');
const CatalogLayout = lazyNamed(() => import('@/pages/Catalog'), 'CatalogLayout');
const DeparturesTab = lazyNamed(() => import('@/pages/Catalog'), 'DeparturesTab');
const NotInDesignTab = lazyNamed(() => import('@/pages/Catalog'), 'NotInDesignTab');
const ToursTab = lazyNamed(() => import('@/pages/Catalog'), 'ToursTab');
const TourEditPage = lazyNamed(() => import('@/pages/Catalog'), 'TourEditPage');
const LayoutEditorPage = lazyNamed(() => import('@/pages/Layouts'), 'LayoutEditorPage');
const LayoutsTab = lazyNamed(() => import('@/pages/Layouts'), 'LayoutsTab');
const ResourcesPage = lazyNamed(() => import('@/pages/Resources'), 'ResourcesPage');
const GuideManifestPage = lazyNamed(() => import('@/pages/Manifests'), 'GuideManifestPage');
const ManifestPage = lazyNamed(() => import('@/pages/Manifests'), 'ManifestPage');
const ManifestsList = lazyNamed(() => import('@/pages/Manifests'), 'ManifestsList');
const MarketingLayout = lazyNamed(() => import('@/pages/Marketing'), 'MarketingLayout');
const PromosPage = lazyNamed(() => import('@/pages/Marketing'), 'PromosPage');
const ReviewsPage = lazyNamed(() => import('@/pages/Marketing'), 'ReviewsPage');
const RulesPage = lazyNamed(() => import('@/pages/Marketing'), 'RulesPage');
const AuditPage = lazyNamed(() => import('@/pages/Security'), 'AuditPage');
const FraudPage = lazyNamed(() => import('@/pages/Security'), 'FraudPage');
const LedgerLayout = lazyNamed(() => import('@/pages/Security'), 'LedgerLayout');
const LedgerPage = lazyNamed(() => import('@/pages/Security'), 'LedgerPage');
const RolesPage = lazyNamed(() => import('@/pages/Security'), 'RolesPage');
const SecurityLayout = lazyNamed(() => import('@/pages/Security'), 'SecurityLayout');
const OutboxPage = lazyNamed(() => import('@/pages/System'), 'OutboxPage');
const ReportsPage = lazyNamed(() => import('@/pages/System'), 'ReportsPage');
const SettingsPage = lazyNamed(() => import('@/pages/System'), 'SettingsPage');
const SystemLayout = lazyNamed(() => import('@/pages/System'), 'SystemLayout');
const TemplatesPage = lazyNamed(() => import('@/pages/System'), 'TemplatesPage');

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, retry: (n, e) => !['forbidden', 'not_found', 'unauthorized'].includes((e as { code?: string }).code ?? '') && n < 2, refetchOnWindowFocus: false } } });

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/login/2fa', element: <TwoFactorPage /> },
  { path: '/guide/:token', element: <Suspense fallback={null}><GuideManifestPage /></Suspense> },
  {
    path: '/', element: <Shell />, children: [
      { index: true, element: <Home /> },
      { path: 'dashboard', element: <Guard perm="orders"><DashboardPage /></Guard> },
      { path: 'orders', element: <Guard perm="orders"><OrdersPage /></Guard> },
      { path: 'customers', element: <Guard perm="orders"><CustomersPage /></Guard> },
      { path: 'payments', element: <Guard perm="orders"><PaymentsPage /></Guard> },
      { path: 'catalog', element: <Guard perm="catalog"><CatalogLayout /></Guard>, children: [
        { index: true, element: <ToursTab /> },
        { path: 'departures', element: <DeparturesTab /> },
        { path: 'addons', element: <NotInDesignTab /> },
        { path: 'transfers', element: <NotInDesignTab /> },
        { path: 'layouts', element: <LayoutsTab /> },
      ] },
      { path: 'catalog/tours/:slug', element: <Guard perm="catalog"><TourEditPage /></Guard> },
      { path: 'catalog/layouts/:id', element: <Guard perm="catalog"><LayoutEditorPage /></Guard> },
      { path: 'resources', element: <Guard perm="resources"><ResourcesPage /></Guard> },
      { path: 'manifests', element: <Guard perm="resources"><ManifestsList /></Guard> },
      { path: 'manifests/:id', element: <Guard perm={['pii']}><ManifestPage /></Guard> },
      { path: 'marketing', element: <Guard perm="marketing"><MarketingLayout /></Guard>, children: [
        { index: true, element: <Navigate to="promos" replace /> },
        { path: 'promos', element: <PromosPage /> },
        { path: 'pricing', element: <RulesPage focus="pricing" /> },
        { path: 'penalties', element: <RulesPage focus="penalties" /> },
        { path: 'loyalty', element: <RulesPage focus="loyalty" /> },
        { path: 'reviews', element: <ReviewsPage /> },
      ] },
      { path: 'security', element: <Guard perm={['system', 'security']}><SecurityLayout /></Guard>, children: [
        { index: true, element: <SecurityIndex /> },
        { path: 'roles', element: <Guard perm="system"><RolesPage /></Guard> },
        { path: 'fraud', element: <Guard perm="security"><FraudPage /></Guard> },
      ] },
      { path: 'ledger', element: <Guard perm="security"><LedgerLayout /></Guard>, children: [
        { index: true, element: <LedgerPage /> },
        { path: 'audit', element: <AuditPage /> },
      ] },
      { path: 'settings', element: <Guard perm="system"><SystemLayout /></Guard>, children: [
        { index: true, element: <SettingsPage /> },
        { path: 'templates', element: <TemplatesPage /> },
        { path: 'outbox', element: <OutboxPage /> },
        { path: 'reports', element: <Guard perm="security"><ReportsPage /></Guard> },
      ] },
      { path: '*', element: <NotFound /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={qc}>
        <SessionProvider><ToastProvider><RouterProvider router={router} /></ToastProvider></SessionProvider>
      </QueryClientProvider>
    </I18nextProvider>
  </StrictMode>,
);
