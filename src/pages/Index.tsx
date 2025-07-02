
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { SpendCharts } from "@/components/dashboard/SpendCharts";
import { RidersTable } from "@/components/dashboard/RidersTable";
import { RiderDashboard } from "@/components/dashboard/RiderDashboard";
import { FinanceDashboard } from "@/components/dashboard/FinanceDashboard";
import { OperationsDashboard } from "@/components/dashboard/OperationsDashboard";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Navigate } from "react-router-dom";
import { useEffect } from "react";

const Index = () => {
  const { isRider, isFinance, isOperations, isAdmin, currentUser } = useAuth();

  // Redirect role-specific users to their dashboards
  if (isRider()) {
    return <Navigate to="/rider-dashboard" replace />;
  }
  
  if (isFinance() && !isAdmin()) {
    return <Navigate to="/finance-dashboard" replace />;
  }

  // Show role-specific dashboard for Admin and Operations
  const getDashboardContent = () => {
    if (isOperations()) {
      return <OperationsDashboard />;
    } else if (isAdmin()) {
      // Admin sees the full dashboard
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Complete overview of Yellow Box operations
            </p>
          </div>

          <DashboardStats />
          <SpendCharts />
          <RidersTable />
        </div>
      );
    }
    
    // Fallback (shouldn't happen with proper auth)
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No dashboard available for your role.</p>
      </div>
    );
  };

  return (
    <Layout>
      {getDashboardContent()}
    </Layout>
  );
};

export default Index;
