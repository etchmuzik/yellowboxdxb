
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { SpendCharts } from "@/components/dashboard/SpendCharts";
import { RidersTable } from "@/components/dashboard/RidersTable";
import { RiderDashboard } from "@/components/dashboard/RiderDashboard";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";

const Index = () => {
  const { isRider } = useAuth();

  return (
    <Layout>
      {isRider() ? (
        <RiderDashboard />
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor rider applications and track expenses
            </p>
          </div>

          <DashboardStats />
          <SpendCharts />
          <RidersTable />
        </div>
      )}
    </Layout>
  );
};

export default Index;
