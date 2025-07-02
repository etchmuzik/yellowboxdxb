
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./hooks/use-auth";
import { NotificationProvider } from "./contexts/NotificationContext";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Reports from "./pages/Reports";
import Riders from "./pages/Riders";
import RiderDetail from "./pages/RiderDetail";
import Expenses from "./pages/Expenses";
import Settings from "./pages/Settings";
import Activity from "./pages/Activity";
import Notifications from "./pages/Notifications";
import BikeTracker from "./pages/BikeTracker";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Visas from "./pages/Visas";
import { Setup } from "./pages/Setup";
import FinanceDashboard from "./pages/FinanceDashboard";
import RiderDashboard from "./pages/RiderDashboard";
import OperationsDashboard from "./pages/OperationsDashboard";
import RequireAuth from "./components/auth/RequireAuth";
import RoleGuard from "./components/auth/RoleGuard";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { SessionProvider } from "./components/auth/SessionProvider";
import { initializeAppData } from "./utils/startupInit";
import { setupGlobalErrorHandlers } from "./services/errorService";
import { useEffect } from "react";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  // Initialize app data on startup
  useEffect(() => {
    initializeAppData();
    setupGlobalErrorHandlers();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="driver-expense-theme">
        <AuthProvider>
          <NotificationProvider>
            <SessionProvider>
              <ErrorBoundary>
                <BrowserRouter>
                  <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/setup" element={<Setup />} />
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <Index />
                  </RequireAuth>
                }
              />
              <Route
                path="/finance-dashboard"
                element={
                  <RoleGuard 
                    feature="expenses" 
                    category="navigation"
                    allowedRoles={['Finance', 'Admin']}
                  >
                    <FinanceDashboard />
                  </RoleGuard>
                }
              />
              <Route
                path="/rider-dashboard"
                element={
                  <RoleGuard 
                    feature="dashboard" 
                    category="navigation"
                    allowedRoles={['Rider-Applicant']}
                  >
                    <RiderDashboard />
                  </RoleGuard>
                }
              />
              <Route
                path="/operations-dashboard"
                element={
                  <RoleGuard 
                    feature="riders" 
                    category="navigation"
                    allowedRoles={['Operations', 'Admin']}
                  >
                    <OperationsDashboard />
                  </RoleGuard>
                }
              />
              <Route
                path="/reports"
                element={
                  <RoleGuard feature="reports" category="navigation">
                    <Reports />
                  </RoleGuard>
                }
              />
              <Route
                path="/riders"
                element={
                  <RoleGuard feature="riders" category="navigation">
                    <Riders />
                  </RoleGuard>
                }
              />
              <Route
                path="/riders/:riderId"
                element={
                  <RoleGuard feature="riders" category="navigation">
                    <RiderDetail />
                  </RoleGuard>
                }
              />
              <Route
                path="/expenses"
                element={
                  <RoleGuard feature="expenses" category="navigation">
                    <Expenses />
                  </RoleGuard>
                }
              />
              <Route
                path="/visas"
                element={
                  <RoleGuard feature="visas" category="navigation">
                    <Visas />
                  </RoleGuard>
                }
              />
              <Route
                path="/settings"
                element={
                  <RequireAuth>
                    <Settings />
                  </RequireAuth>
                }
              />
              <Route
                path="/activity"
                element={
                  <RoleGuard feature="activity" category="navigation">
                    <Activity />
                  </RoleGuard>
                }
              />
              <Route
                path="/notifications"
                element={
                  <RequireAuth>
                    <Notifications />
                  </RequireAuth>
                }
              />
              <Route
                path="/bike-tracker"
                element={
                  <RoleGuard feature="bikeTracker" category="navigation">
                    <BikeTracker />
                  </RoleGuard>
                }
              />
              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <Profile />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
          <PWAInstallPrompt />
              </ErrorBoundary>
            </SessionProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
