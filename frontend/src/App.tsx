import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext";
import { OfflineProvider } from "./context/OfflineContext";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { PublicLayout } from "./components/layout/PublicLayout";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { ScreeningWizard } from "./pages/ScreeningWizard";
import { useAuth } from "./context/AuthContext";
import { OfflineIndicator } from "./components/OfflineIndicator";

const queryClient = new QueryClient();

import { DashboardHome } from "./pages/DashboardHome";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { FeaturesPage } from "./pages/FeaturesPage";
import { AboutPage } from "./pages/AboutPage";
import { PatientsPage } from "./pages/PatientsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OfflineProvider>
          <BrowserRouter>
            <OfflineIndicator />
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/features" element={<FeaturesPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Protected Routes (Dashboard) */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<DashboardHome />} />
                <Route path="patients" element={<PatientsPage />} />
                <Route path="screen" element={<ScreeningWizard />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="appointments" element={<AppointmentsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </OfflineProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App


