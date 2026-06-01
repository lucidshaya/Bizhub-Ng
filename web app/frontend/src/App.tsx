import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/web/Toast';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { WebApp } from './pages/WebApp';
import { RetailApp } from './pages/RetailApp';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { AcceptInvitePage } from './pages/AcceptInvitePage';
import { ResetPinPage } from './pages/ResetPinPage';
import { SubscriptionFlow } from './pages/SubscriptionFlow';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen bg-[#0A0E1A] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1E2535] border-t-[#00D084] rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen bg-[#0A0E1A] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1E2535] border-t-[#00D084] rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={user?.storeMode === 'RETAIL_STORE' ? '/retail' : '/dashboard'} replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<LandingPage />} />
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <LoginPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/signup"
                  element={
                    <PublicRoute>
                      <SignupPage />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <PublicRoute>
                      <ForgotPasswordPage />
                    </PublicRoute>
                  }
                />

                {/* Auth callback for OAuth */}
                <Route path="/auth/callback" element={<AuthCallbackPage />} />

                {/* Worker invitation acceptance */}
                <Route path="/invite/accept" element={<AcceptInvitePage />} />

                {/* Reset PIN via email */}
                <Route path="/reset-pin" element={<ResetPinPage />} />

                {/* Subscription / Onboarding flow */}
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <SubscriptionFlow />
                    </ProtectedRoute>
                  }
                />

                {/* Protected routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <WebApp />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/retail"
                  element={
                    <ProtectedRoute>
                      <RetailApp />
                    </ProtectedRoute>
                  }
                />
                {/* Admin routes (no user auth needed, uses own admin auth) */}
                <Route path="/admin" element={<AdminLoginPage />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}