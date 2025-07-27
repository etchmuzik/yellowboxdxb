
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";

const Index = () => {
  const { isRider, isFinance, isOperations, isAdmin } = useAuth();

  // Redirect role-specific users to their dedicated dashboards
  if (isRider()) {
    return <Navigate to="/rider-dashboard" replace />;
  }
  
  if (isFinance() && !isAdmin()) {
    return <Navigate to="/finance-dashboard" replace />;
  }
  
  if (isOperations() && !isAdmin()) {
    return <Navigate to="/operations-dashboard" replace />;
  }

  // Admin users see the admin dashboard
  if (isAdmin()) {
    return <AdminDashboard />;
  }

  // Fallback (shouldn't happen with proper auth)
  return (
    <Layout>
      <div className="text-center py-12">
        <p className="text-muted-foreground">No dashboard available for your role.</p>
      </div>
    </Layout>
  );
};

export default Index;
