import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/auth.context.js';
import { CycleProvider } from './contexts/cycle.context.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { Layout } from './components/Layout.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { AdminRoute } from './components/AdminRoute.js';

// ── Lazy-loaded page components ────────────────────────────────
const LoginPage = lazy(() => import('./pages/LoginPage.js').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage.js').then(m => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.js').then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.js').then(m => ({ default: m.ResetPasswordPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage.js').then(m => ({ default: m.DashboardPage })));
const ObjectiveDetailPage = lazy(() => import('./pages/ObjectiveDetailPage.js').then(m => ({ default: m.ObjectiveDetailPage })));
const CascadeTreePage = lazy(() => import('./pages/CascadeTreePage.js').then(m => ({ default: m.CascadeTreePage })));
const TeamPage = lazy(() => import('./pages/TeamPage.js').then(m => ({ default: m.TeamPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage.js').then(m => ({ default: m.ProfilePage })));
const BulkCheckInPage = lazy(() => import('./pages/BulkCheckInPage.js').then(m => ({ default: m.BulkCheckInPage })));
const AdminPage = lazy(() => import('./pages/AdminPage.js').then(m => ({ default: m.AdminPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.js').then(m => ({ default: m.NotFoundPage })));

function PageLoader() {
  return (
    <div className="flex min-h-[400px] items-center justify-center" role="status">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        <span className="text-sm text-slate-400">Loading…</span>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route element={<ProtectedRoute />}>
                <Route
                  element={
                    <CycleProvider>
                      <Layout />
                    </CycleProvider>
                  }
                >
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={
                    <ErrorBoundary>
                      <DashboardPage />
                    </ErrorBoundary>
                  } />
                  <Route path="/check-in" element={
                    <ErrorBoundary>
                      <BulkCheckInPage />
                    </ErrorBoundary>
                  } />
                  <Route path="/objectives/:id" element={
                    <ErrorBoundary>
                      <ObjectiveDetailPage />
                    </ErrorBoundary>
                  } />
                  <Route path="/cascade" element={
                    <ErrorBoundary>
                      <CascadeTreePage />
                    </ErrorBoundary>
                  } />
                  <Route path="/team" element={
                    <ErrorBoundary>
                      <TeamPage />
                    </ErrorBoundary>
                  } />
                  <Route path="/profile" element={
                    <ErrorBoundary>
                      <ProfilePage />
                    </ErrorBoundary>
                  } />
                  <Route element={<AdminRoute />}>
                    <Route path="/admin" element={
                      <ErrorBoundary>
                        <AdminPage />
                      </ErrorBoundary>
                    } />
                  </Route>
                </Route>
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
