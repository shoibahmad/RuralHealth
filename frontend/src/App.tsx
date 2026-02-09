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
import { OfficerLayout } from "./components/layout/OfficerLayout";
import { PatientLayout } from "./components/layout/PatientLayout";
import { ScreeningWizard } from "./pages/ScreeningWizard";
import { useAuth } from "./context/AuthContext";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { PatientDashboard } from "./pages/PatientDashboard";
import { PatientScreeningHistory } from "./pages/PatientScreeningHistory";
import { ScreeningDetailPage } from "./pages/ScreeningDetailPage";

const queryClient = new QueryClient();

import { DashboardHome } from "./pages/DashboardHome";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { FeaturesPage } from "./pages/FeaturesPage";
import { AboutPage } from "./pages/AboutPage";
import { PatientsPage } from "./pages/PatientsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { AppointmentsPage } from "./pages/AppointmentsPage";
import { OfficerDashboard } from "./pages/OfficerDashboard";
import { HealthWorkersPage } from "./pages/HealthWorkersPage";
import { WorkerDetailPage } from "./pages/WorkerDetailPage";
import { AllPatientsPage } from "./pages/AllPatientsPage";
import { PatientHistoryPage } from "./pages/PatientHistoryPage";
import { SystemAnalyticsPage } from "./pages/SystemAnalyticsPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { TermsConditionsPage } from "./pages/TermsConditionsPage";
import DataSecurityPage from "./pages/DataSecurityPage";
import { APIDocsPage } from "./pages/APIDocsPage";
import { SettingsPage } from "./pages/SettingsPage";

// Protected Route Wrapper for Health Workers
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isHealthWorker, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isHealthWorker) {
    const { isHealthOfficer, isPatient } = useAuth();
    if (isHealthOfficer) return <Navigate to="/officer/dashboard" replace />;
    if (isPatient) return <Navigate to="/patient/dashboard" replace />;
  }
  return <>{children}</>;
};

// Protected Route Wrapper for Health Officers
const OfficerRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isHealthOfficer, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isHealthOfficer) {
    const { isHealthWorker, isPatient } = useAuth();
    if (isHealthWorker) return <Navigate to="/dashboard" replace />;
    if (isPatient) return <Navigate to="/patient/dashboard" replace />;
  }
  return <>{children}</>;
};

// Protected Route Wrapper for Patients
const PatientRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isPatient, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="h-8 w-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isPatient) {
    const { isHealthWorker, isHealthOfficer } = useAuth();
    if (isHealthWorker) return <Navigate to="/dashboard" replace />;
    if (isHealthOfficer) return <Navigate to="/officer/dashboard" replace />;
  }
  return <>{children}</>;
};

import { ToastProvider } from "./context/ToastContext";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
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
                  <Route path="/api-docs" element={<APIDocsPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms-conditions" element={<TermsConditionsPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/data-security" element={<DataSecurityPage />} />
                </Route>

                {/* Health Worker Routes */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<DashboardHome />} />
                  <Route path="patients" element={<PatientsPage />} />
                  <Route path="patients/:id/history" element={<PatientHistoryPage />} />
                  <Route path="screenings/:id" element={<ScreeningDetailPage />} />
                  <Route path="screen" element={<ScreeningWizard />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="appointments" element={<AppointmentsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Health Officer Routes */}
                <Route path="/officer" element={
                  <OfficerRoute>
                    <OfficerLayout />
                  </OfficerRoute>
                }>
                  <Route index element={<Navigate to="/officer/dashboard" replace />} />
                  <Route path="dashboard" element={<OfficerDashboard />} />
                  <Route path="workers" element={<HealthWorkersPage />} />
                  <Route path="workers/:id" element={<WorkerDetailPage />} />
                  <Route path="patients" element={<AllPatientsPage />} />
                  <Route path="patients/:id/history" element={<PatientHistoryPage />} />
                  <Route path="screenings/:id" element={<ScreeningDetailPage />} />
                  <Route path="analytics" element={<SystemAnalyticsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Patient Portal Routes */}
                <Route path="/patient" element={
                  <PatientRoute>
                    <PatientLayout />
                  </PatientRoute>
                }>
                  <Route index element={<Navigate to="/patient/dashboard" replace />} />
                  <Route path="dashboard" element={<PatientDashboard />} />
                  <Route path="screening" element={<ScreeningWizard />} />
                  <Route path="history" element={<PatientScreeningHistory />} />
                  <Route path="screenings/:id" element={<ScreeningDetailPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </OfflineProvider>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
