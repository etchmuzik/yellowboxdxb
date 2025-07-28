
import { useAuth } from "@/hooks/use-auth";
import AdminDashboard from "./AdminDashboard";
import RiderDashboard from "./RiderDashboard";
import FinanceDashboard from "./FinanceDashboard";
import OperationsDashboard from "./OperationsDashboard";

const Index = () => {
  const { isRider, isFinance, isOperations, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Display the appropriate dashboard based on user role
  // Admin role takes precedence if user has multiple roles
  if (isAdmin()) {
    return <AdminDashboard />;
  }

  if (isOperations()) {
    return <OperationsDashboard />;
  }

  if (isFinance()) {
    return <FinanceDashboard />;
  }

  if (isRider()) {
    return <RiderDashboard />;
  }

  // This shouldn't happen with proper auth, but provide a fallback
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome to Yellow Box</h2>
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    </div>
  );
};

export default Index;
