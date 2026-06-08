import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/app/ErrorBoundary";
import PageTransition from "./components/app/PageTransition";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthCallback from "./pages/AuthCallback";
import AuthenticatedLayout from "./components/app/AuthenticatedLayout";
import InvestigationsListPage from "./pages/InvestigationsListPage";
import InvestigatePage from "./pages/InvestigatePage";
import InvestigationProgressPage from "./pages/InvestigationProgressPage";
import ReportPage from "./pages/ReportPage";
import SettingsPage from "./pages/SettingsPage";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
        <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <PageTransition><InvestigationsListPage /></PageTransition>
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/investigate"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <PageTransition><InvestigatePage /></PageTransition>
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/investigation/:id"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <PageTransition><InvestigationProgressPage /></PageTransition>
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/report/:id"
          element={
            <AuthenticatedLayout fullWidth>
              <PageTransition><ReportPage /></PageTransition>
            </AuthenticatedLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AuthenticatedLayout>
                <PageTransition><SettingsPage /></PageTransition>
              </AuthenticatedLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <AnimatedRoutes />
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
