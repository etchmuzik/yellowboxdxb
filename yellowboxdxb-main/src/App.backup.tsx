import "./App.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "./pages/Index";
import Login from "./pages/Login";
import { Setup } from "./pages/Setup";
import AdminDashboard from "./pages/AdminDashboard";
import RiderDashboard from "./pages/RiderDashboard";
import FinanceDashboard from "./pages/FinanceDashboard";
import Expenses from "./pages/Expenses";
import OperationsDashboard from "./pages/OperationsDashboard";
import NotFound from "./pages/NotFound";
import BikeTracker from "./pages/BikeTracker";
import Riders from "./pages/Riders";
import Budget from "./pages/Budget";
import Visas from "./pages/Visas";
import Documents from "./pages/Documents";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import RequireAuth from "./components/auth/RequireAuth";
import { AuthProvider } from "@/hooks/use-auth";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import Profile from "./pages/Profile";
import { initializeAppData } from "./utils/startupInit";
import { setupGlobalErrorHandlers } from "./services/errorService";
import { useEffect } from "react";

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    initializeAppData();
    setupGlobalErrorHandlers();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="driver-expense-theme">
        <BrowserRouter>
          <AuthProvider>
            <NotificationProvider>
              <SessionProvider>
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
                    path="/admin"
                    element={
                      <RequireAuth roles={["admin"]}>
                        <AdminDashboard />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/riders"
                    element={
                      <RequireAuth roles={["admin", "operations"]}>
                        <Riders />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/expenses"
                    element={
                      <RequireAuth>
                        <Expenses />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/bike-tracker"
                    element={
                      <RequireAuth roles={["admin", "operations"]}>
                        <BikeTracker />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/finance"
                    element={
                      <RequireAuth roles={["finance", "admin"]}>
                        <FinanceDashboard />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/budget"
                    element={
                      <RequireAuth roles={["finance", "admin"]}>
                        <Budget />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/operations"
                    element={
                      <RequireAuth roles={["operations", "admin"]}>
                        <OperationsDashboard />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/visas"
                    element={
                      <RequireAuth roles={["admin", "operations"]}>
                        <Visas />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/documents"
                    element={
                      <RequireAuth roles={["admin", "operations"]}>
                        <Documents />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/rider"
                    element={
                      <RequireAuth roles={["rider-applicant"]}>
                        <RiderDashboard />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/analytics"
                    element={
                      <RequireAuth roles={["admin", "finance"]}>
                        <Analytics />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      <RequireAuth roles={["admin", "finance", "operations"]}>
                        <Reports />
                      </RequireAuth>
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
                    path="/notifications"
                    element={
                      <RequireAuth>
                        <Notifications />
                      </RequireAuth>
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
                <Toaster />
                <PWAInstallPrompt />
              </SessionProvider>
            </NotificationProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
