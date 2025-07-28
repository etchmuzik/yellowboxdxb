import "./App.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import RequireAuth from "./components/auth/RequireAuth";
import { AuthProvider } from "@/hooks/use-auth";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { initializeAppData } from "./utils/startupInit";
import { setupGlobalErrorHandlers } from "./services/errorService";
import { useEffect, Suspense } from "react";
import { lazy } from "react";

// Lazy load all page components for better code splitting
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Setup = lazy(() => import("./pages/Setup").then(module => ({ default: module.Setup })));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const RiderDashboard = lazy(() => import("./pages/RiderDashboard"));
const FinanceDashboard = lazy(() => import("./pages/FinanceDashboard"));
const Expenses = lazy(() => import("./pages/Expenses"));
const OperationsDashboard = lazy(() => import("./pages/OperationsDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const BikeTracker = lazy(() => import("./pages/BikeTracker"));
const Riders = lazy(() => import("./pages/Riders"));
const Budget = lazy(() => import("./pages/Budget"));
const Visas = lazy(() => import("./pages/Visas"));
const Documents = lazy(() => import("./pages/Documents"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Profile = lazy(() => import("./pages/Profile"));
const SimpleTest = lazy(() => import("./pages/SimpleTest"));
const RidersDebug = lazy(() => import("./pages/RidersDebug"));

import PageLoader from "@/components/ui/page-loader";

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    // Temporarily commented out to debug white page issue
    // initializeAppData();
    // setupGlobalErrorHandlers();

  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="driver-expense-theme">
        <BrowserRouter>
          <AuthProvider>
            <NotificationProvider>
              <SessionProvider>
                <Suspense fallback={<PageLoader />}>
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
                        <RequireAuth roles={["Admin"]}>
                          <AdminDashboard />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/riders"
                      element={<Riders />}
                    />
                    <Route
                      path="/expenses"
                      element={<Expenses />}
                    />
                    <Route
                      path="/bike-tracker"
                      element={
                        <RequireAuth roles={["Admin", "Operations"]}>
                          <BikeTracker />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/finance"
                      element={
                        <RequireAuth roles={["Finance", "Admin"]}>
                          <FinanceDashboard />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/budget"
                      element={
                        <RequireAuth roles={["Finance", "Admin"]}>
                          <Budget />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/operations"
                      element={
                        <RequireAuth roles={["Operations", "Admin"]}>
                          <OperationsDashboard />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/visas"
                      element={
                        <RequireAuth roles={["Admin", "Operations"]}>
                          <Visas />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/documents"
                      element={
                        <RequireAuth roles={["Admin", "Operations"]}>
                          <Documents />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/rider"
                      element={
                        <RequireAuth roles={["Rider-Applicant"]}>
                          <RiderDashboard />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/analytics"
                      element={
                        <RequireAuth roles={["Admin", "Finance"]}>
                          <Analytics />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/reports"
                      element={
                        <RequireAuth roles={["Admin", "Finance", "Operations"]}>
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
                    <Route
                      path="/simple-test"
                      element={
                        <RequireAuth roles={["Admin"]}>
                          <SimpleTest />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/riders-debug"
                      element={
                        <RequireAuth roles={["Admin"]}>
                          <RidersDebug />
                        </RequireAuth>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
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
