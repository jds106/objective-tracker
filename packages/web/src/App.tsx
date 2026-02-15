import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/auth.context.js';
import { CycleProvider } from './contexts/cycle.context.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { Layout } from './components/Layout.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ObjectiveDetailPage } from './pages/ObjectiveDetailPage.js';
import { CascadeTreePage } from './pages/CascadeTreePage.js';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.js';
import { ResetPasswordPage } from './pages/ResetPasswordPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { AdminRoute } from './components/AdminRoute.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/objectives/:id" element={<ObjectiveDetailPage />} />
              <Route path="/cascade" element={<CascadeTreePage />} />
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
