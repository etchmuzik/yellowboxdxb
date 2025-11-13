import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  CreditCard, 
  Bike, 
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Zap
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/config/supabase";
import { formatCurrency, formatDate } from "@/utils/dataUtils";
import { SpendChartsWithSuspense as SpendCharts } from "@/components/ui/lazy-components";
import { WebhookTestPanel } from "@/components/admin/WebhookTestPanel";

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
}

interface DashboardMetrics {
  totalRiders: number;
  activeRiders: number;
  pendingApplications: number;
  totalExpenses: number;
  pendingExpenses: number;
  monthlyBudget: number;
  budgetUsed: number;
  availableBikes: number;
  bikesInUse: number;
  bikesInMaintenance: number;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRiders: 0,
    activeRiders: 0,
    pendingApplications: 0,
    totalExpenses: 0,
    pendingExpenses: 0,
    monthlyBudget: 50000,
    budgetUsed: 0,
    availableBikes: 0,
    bikesInUse: 0,
    bikesInMaintenance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch riders data from Supabase
      const { data: riders } = await supabase.from('riders').select('*');

      const totalRiders = riders?.length || 0;
      const activeRiders = riders?.filter(r => r.status === "active").length || 0;
      const pendingApplications = riders?.filter(r =>
        r.status === "pending" || r.status === "application"
      ).length || 0;

      // Fetch expenses data
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);

      const { data: expenses } = await supabase
        .from('expenses')
        .select('*')
        .gte('submitted_at', startOfMonth.toISOString());

      const totalExpenses = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;
      const pendingExpenses = expenses?.filter(exp => exp.status === "pending").length || 0;

      // Fetch bikes data
      const { data: bikes } = await supabase.from('bikes').select('*');

      const availableBikes = bikes?.filter(b => b.status === "available").length || 0;
      const bikesInUse = bikes?.filter(b => b.status === "in-use").length || 0;
      const bikesInMaintenance = bikes?.filter(b => b.status === "maintenance").length || 0;

      // Fetch budget data
      const { data: budgets } = await supabase
        .from('budgets')
        .select('*')
        .eq('month', currentMonth.getMonth() + 1)
        .eq('year', currentMonth.getFullYear())
        .limit(1);

      const currentBudget = budgets?.[0];
      const monthlyBudget = currentBudget?.total_budget || 50000;
      const budgetUsed = totalExpenses;

      // Fetch recent activity
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { data: activities } = await supabase
        .from('activity_logs')
        .select('*')
        .gte('timestamp', sevenDaysAgo.toISOString())
        .order('timestamp', { ascending: false })
        .limit(5);

      setMetrics({
        totalRiders,
        activeRiders,
        pendingApplications,
        totalExpenses,
        pendingExpenses,
        monthlyBudget,
        budgetUsed,
        availableBikes,
        bikesInUse,
        bikesInMaintenance,
      });
      setRecentActivity(activities as ActivityItem[] || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "rider_added":
        return <Users className="h-4 w-4" />;
      case "expense_submitted":
        return <CreditCard className="h-4 w-4" />;
      case "bike_assigned":
        return <Bike className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const budgetPercentage = (metrics.budgetUsed / metrics.monthlyBudget) * 100;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Complete overview of Yellow Box operations
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Riders Overview */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/riders")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Riders</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalRiders}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="success" className="h-5">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {metrics.activeRiders} Active
                </Badge>
                <Badge variant="warning" className="h-5">
                  <Clock className="h-3 w-3 mr-1" />
                  {metrics.pendingApplications} Pending
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Budget Status */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/expenses")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.monthlyBudget)}</div>
              <Progress value={budgetPercentage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {formatCurrency(metrics.budgetUsed)} used ({budgetPercentage.toFixed(0)}%)
              </p>
            </CardContent>
          </Card>

          {/* Fleet Status */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/bike-tracker")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fleet Status</CardTitle>
              <Bike className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.availableBikes + metrics.bikesInUse + metrics.bikesInMaintenance}
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Badge variant="success" className="h-5">{metrics.availableBikes}</Badge>
                <Badge variant="default" className="h-5">{metrics.bikesInUse}</Badge>
                <Badge variant="destructive" className="h-5">{metrics.bikesInMaintenance}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Pending Actions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pendingExpenses + metrics.pendingApplications}</div>
              <div className="space-y-1 mt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-between h-auto p-1"
                  onClick={() => navigate("/expenses")}
                >
                  <span className="text-xs">{metrics.pendingExpenses} expenses</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-between h-auto p-1"
                  onClick={() => navigate("/riders")}
                >
                  <span className="text-xs">{metrics.pendingApplications} applications</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <SpendCharts />

        {/* Recent Activity & Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading activity...</p>
                ) : recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                ) : (
                  recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-center gap-3 text-sm">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.timestamp && formatDate(activity.timestamp.toDate())}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-4"
                onClick={() => navigate("/activity")}
              >
                View All Activity
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full justify-start bg-nike-red hover:bg-nike-red/90"
                onClick={() => navigate("/riders?action=add")}
              >
                <Users className="mr-2 h-4 w-4" />
                Add New Rider
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/riders")}
              >
                <Users className="mr-2 h-4 w-4" />
                Manage Riders
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/expenses")}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Review Expenses
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/bike-tracker")}
              >
                <Bike className="mr-2 h-4 w-4" />
                Track Fleet
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate("/reports")}
              >
                <Package className="mr-2 h-4 w-4" />
                Generate Reports
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Webhook Testing Panel */}
        <WebhookTestPanel />
      </div>
    </Layout>
  );
};

export default AdminDashboard;