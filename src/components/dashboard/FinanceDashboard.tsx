import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Receipt, Users, Calendar, AlertCircle } from "lucide-react";
import { getBudgets } from "@/services/budgetService";
import { getAllExpenses } from "@/services/expenseService";
import { getAllRiders } from "@/services/riderService";
import { SpendCategory, Rider, SpendEvent } from "@/types";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function FinanceDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentBudget, setCurrentBudget] = useState<any>(null);
  const [expenses, setExpenses] = useState<SpendEvent[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [pendingExpenses, setPendingExpenses] = useState<SpendEvent[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current month's budget
        const budgets = await getBudgets();
        const currentMonth = format(new Date(), 'yyyy-MM');
        const monthBudget = budgets.find(b => b.month === currentMonth);
        setCurrentBudget(monthBudget);

        // Fetch all expenses
        const allExpenses = await getAllExpenses();
        setExpenses(allExpenses);

        // Filter pending expenses for approval
        const pending = allExpenses.filter((exp: any) => exp.status === 'pending');
        setPendingExpenses(pending);

        // Fetch riders for visa cost tracking
        const allRiders = await getAllRiders();
        setRiders(allRiders);
      } catch (error) {
        console.error("Error fetching finance data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-t-nike-red rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate budget utilization
  const budgetUtilization = currentBudget 
    ? (currentBudget.spentAed / currentBudget.allocatedAed) * 100 
    : 0;

  // Calculate expense categories breakdown
  const categoryBreakdown = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amountAed;
    return acc;
  }, {} as Record<SpendCategory, number>);

  // Count riders needing visa renewal
  const ridersNeedingVisaRenewal = riders.filter(rider => {
    // This is a placeholder - you'd check actual visa expiry dates
    return rider.applicationStage === 'ID Issued' || rider.applicationStage === 'Active';
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Finance Dashboard</h1>
        <p className="text-muted-foreground">
          Budget management and expense oversight
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              AED {currentBudget?.allocatedAed.toLocaleString() || '0'}
            </div>
            <div className="mt-2">
              <Progress value={budgetUtilization} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {budgetUtilization.toFixed(1)}% utilized
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              AED {currentBudget?.spentAed.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {expenses.length} expenses this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingExpenses.length}</div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs"
              onClick={() => navigate('/expenses')}
            >
              Review expenses →
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visa Renewals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ridersNeedingVisaRenewal}</div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs"
              onClick={() => navigate('/visas')}
            >
              Manage visas →
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Expense Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(categoryBreakdown)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellowbox-yellow rounded-full" />
                    <span className="text-sm font-medium">{category}</span>
                  </div>
                  <span className="text-sm font-bold">
                    AED {amount.toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Financial Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenses.slice(0, 5).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{expense.category}</p>
                  <p className="text-xs text-muted-foreground">
                    {expense.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">AED {expense.amountAed}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(expense.date), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}