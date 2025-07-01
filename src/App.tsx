
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./hooks/use-auth";
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
import RequireAuth from "./components/auth/RequireAuth";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="driver-expense-theme">
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <Index />
                  </RequireAuth>
                }
              />
              <Route
                path="/reports"
                element={
                  <RequireAuth>
                    <Reports />
                  </RequireAuth>
                }
              />
              <Route
                path="/riders"
                element={
                  <RequireAuth>
                    <Riders />
                  </RequireAuth>
                }
              />
              <Route
                path="/riders/:riderId"
                element={
                  <RequireAuth>
                    <RiderDetail />
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
                path="/visas"
                element={
                  <RequireAuth>
                    <Visas />
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
                path="/activity"
                element={
                  <RequireAuth>
                    <Activity />
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
                path="/bike-tracker"
                element={
                  <RequireAuth>
                    <BikeTracker />
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
          </BrowserRouter>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
