import { Suspense, lazy, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ProtectedLayout } from "./components/ProtectedLayout";
import { BackgroundEffects } from "./components/BackgroundEffects";
import { CookieConsent } from "./components/CookieConsent";
import { VisualSettingsProvider } from "./features/settings/VisualSettingsContext";
import { AiProvider } from "./features/ai/AiContext";
import { PageLoader } from "./components/PageLoader";

// Lazy-loaded pages
const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const BusinessPlansPage = lazy(() => import("./pages/BusinessPlansPage").then((m) => ({ default: m.BusinessPlansPage })));
const BusinessPlanDetailsPage = lazy(() => import("./pages/BusinessPlanDetailsPage").then((m) => ({ default: m.BusinessPlanDetailsPage })));
const FinancialPlansPage = lazy(() => import("./pages/FinancialPlansPage").then((m) => ({ default: m.FinancialPlansPage })));
const FinancialPlanDetailsPage = lazy(() => import("./pages/FinancialPlanDetailsPage").then((m) => ({ default: m.FinancialPlanDetailsPage })));
const NotesPage = lazy(() => import("./pages/NotesPage").then((m) => ({ default: m.NotesPage })));
const CalendarPage = lazy(() => import("./pages/CalendarPage").then((m) => ({ default: m.CalendarPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const SearchPage = lazy(() => import("./pages/SearchPage").then((m) => ({ default: m.SearchPage })));
const TaxCalendarPage = lazy(() => import("./pages/TaxCalendarPage").then((m) => ({ default: m.TaxCalendarPage })));
const KanbanPage = lazy(() => import("./pages/KanbanPage").then((m) => ({ default: m.KanbanPage })));
const CrmPage = lazy(() => import("./pages/CrmPage").then((m) => ({ default: m.CrmPage })));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage").then((m) => ({ default: m.NotificationsPage })));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage").then((m) => ({ default: m.VerifyEmailPage })));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage })));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage").then((m) => ({ default: m.PrivacyPolicyPage })));
const TermsOfUsePage = lazy(() => import("./pages/TermsOfUsePage").then((m) => ({ default: m.TermsOfUsePage })));
const CookiePolicyPage = lazy(() => import("./pages/CookiePolicyPage").then((m) => ({ default: m.CookiePolicyPage })));

// Lazy-loaded heavy modals
const AuthModal = lazy(() => import("./components/AuthModal").then((m) => ({ default: m.AuthModal })));

const PageFallback = <PageLoader />;

function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <VisualSettingsProvider>
      <AiProvider>
      <BackgroundEffects />
      <Routes>
        <Route path="/" element={
          <Suspense fallback={PageFallback}>
            <HomePage onOpenAuth={() => setAuthModalOpen(true)} />
          </Suspense>
        } />
        <Route path="/verify" element={
          <Suspense fallback={PageFallback}>
            <VerifyEmailPage />
          </Suspense>
        } />
        <Route path="/reset-password" element={
          <Suspense fallback={PageFallback}>
            <ResetPasswordPage />
          </Suspense>
        } />
        <Route path="/privacy" element={
          <Suspense fallback={PageFallback}>
            <PrivacyPolicyPage />
          </Suspense>
        } />
        <Route path="/terms" element={
          <Suspense fallback={PageFallback}>
            <TermsOfUsePage />
          </Suspense>
        } />
        <Route path="/cookie-policy" element={
          <Suspense fallback={PageFallback}>
            <CookiePolicyPage />
          </Suspense>
        } />
        <Route element={<ProtectedLayout />}>
          <Route path="/business-plans" element={
            <Suspense fallback={PageFallback}>
              <BusinessPlansPage />
            </Suspense>
          } />
          <Route path="/business-plans/:id" element={
            <Suspense fallback={<PageLoader />}>
              <BusinessPlanDetailsPage />
            </Suspense>
          } />
          <Route path="/financial-plans" element={
            <Suspense fallback={PageFallback}>
              <FinancialPlansPage />
            </Suspense>
          } />
          <Route path="/financial-plans/:id" element={
            <Suspense fallback={<PageLoader />}>
              <FinancialPlanDetailsPage />
            </Suspense>
          } />
          <Route path="/notes" element={
            <Suspense fallback={PageFallback}>
              <NotesPage />
            </Suspense>
          } />
          <Route path="/calendar" element={
            <Suspense fallback={PageFallback}>
              <CalendarPage />
            </Suspense>
          } />
          <Route path="/dashboard" element={
            <Suspense fallback={PageFallback}>
              <DashboardPage />
            </Suspense>
          } />
          <Route path="/search" element={
            <Suspense fallback={PageFallback}>
              <SearchPage />
            </Suspense>
          } />
          <Route path="/tax-calendar" element={
            <Suspense fallback={PageFallback}>
              <TaxCalendarPage />
            </Suspense>
          } />
          <Route path="/kanban" element={
            <Suspense fallback={PageFallback}>
              <KanbanPage />
            </Suspense>
          } />
          <Route path="/crm" element={
            <Suspense fallback={PageFallback}>
              <CrmPage />
            </Suspense>
          } />
          <Route path="/notifications" element={
            <Suspense fallback={PageFallback}>
              <NotificationsPage />
            </Suspense>
          } />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Suspense fallback={null}>
        {authModalOpen && (
          <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
        )}
      </Suspense>
      </AiProvider>
      <CookieConsent />
      <Toaster
        position="top-right"
        containerStyle={{ zIndex: 99999 }}
        toastOptions={{
          duration: 4000,
          style: {
            background: "var(--bg-card)",
            border: "1px solid var(--border-primary)",
            color: "var(--text-primary)",
            borderRadius: "12px",
            fontSize: "14px",
            padding: "12px 16px",
          },
        }}
      />
    </VisualSettingsProvider>
  );
}

export default App;
