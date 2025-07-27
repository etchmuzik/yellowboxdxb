import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Download
} from 'lucide-react';
import { getAllExpenses, getExpensesByStatus } from '@/services/expenseService';
import { getAllBudgets } from '@/services/budgetService';
import { formatCurrency } from '@/utils/dataUtils';
import { SpendEvent, Budget } from '@/types';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { ExpenseApprovalList } from '@/components/expenses/ExpenseApprovalList';
import { BudgetOverview } from '@/components/finance/BudgetOverview';
import { MonthlyReport } from '@/components/finance/MonthlyReport';
import { exportFinancialSummaryPDF } from '@/utils/pdfExportUtils';
import { getAllRiders } from '@/services/riderService';
import { toast } from '@/components/ui/use-toast';

export default function FinanceDashboard() {
  const { currentUser } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  // Fetch expenses
  const { data: allExpenses = [], isLoading: expensesLoading } = useQuery<SpendEvent[]>({
    queryKey: ['expenses'],
    queryFn: getAllExpenses,
  });

  // Fetch pending expenses
  const { data: pendingExpenses = [] } = useQuery<SpendEvent[]>({
    queryKey: ['expenses', 'pending'],
    queryFn: () => getExpensesByStatus('pending'),
  });

  // Fetch budgets
  const { data: budgets = [], isLoading: budgetsLoading } = useQuery<Budget[]>({
    queryKey: ['budgets'],
    queryFn: getAllBudgets,
  });

  const isLoading = expensesLoading || budgetsLoading;

  // Calculate current month expenses
  const currentMonthExpenses = allExpenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= startOfMonth(selectedMonth) && expenseDate <= endOfMonth(selectedMonth);
  });

  // Calculate totals
  const totalExpenses = currentMonthExpenses.reduce((sum, exp) => sum + exp.amountAed, 0);
  const approvedExpenses = currentMonthExpenses
    .filter(exp => exp.status === 'approved')
    .reduce((sum, exp) => sum + exp.amountAed, 0);
  const pendingAmount = pendingExpenses.reduce((sum, exp) => sum + exp.amountAed, 0);

  // Get current month budget
  const currentMonthBudget = budgets.find(budget => {
    const budgetDate = new Date(budget.month);
    return budgetDate.getMonth() === selectedMonth.getMonth() && 
           budgetDate.getFullYear() === selectedMonth.getFullYear();
  });

  const totalBudget = currentMonthBudget?.totalBudget || 0;
  const remainingBudget = totalBudget - approvedExpenses;
  const budgetUtilization = totalBudget > 0 ? (approvedExpenses / totalBudget) * 100 : 0;

  const handleExportReport = async () => {
    try {
      const riders = await getAllRiders();
      exportFinancialSummaryPDF(allExpenses, budgets, riders);
      toast({
        title: 'Report Exported',
        description: 'Financial summary report has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Finance Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {currentUser?.name}</p>
        </div>
        <Button variant="outline" onClick={handleExportReport}>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBudget)}</div>
            <p className="text-xs text-muted-foreground">
              For {format(selectedMonth, 'MMMM yyyy')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Expenses</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(approvedExpenses)}</div>
            <p className="text-xs text-muted-foreground">
              {budgetUtilization.toFixed(1)}% of budget used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {pendingExpenses.length} expenses waiting
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
            {remainingBudget >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remainingBudget < 0 ? 'text-red-600' : ''}`}>
              {formatCurrency(Math.abs(remainingBudget))}
            </div>
            <p className="text-xs text-muted-foreground">
              {remainingBudget < 0 ? 'Over budget' : 'Available to spend'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="approvals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          <TabsTrigger value="budgets">Budget Overview</TabsTrigger>
          <TabsTrigger value="reports">Monthly Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Expenses Awaiting Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseApprovalList expenses={pendingExpenses} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <BudgetOverview 
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
            budgets={budgets}
            expenses={allExpenses}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <MonthlyReport
            selectedMonth={selectedMonth}
            expenses={currentMonthExpenses}
            budget={currentMonthBudget}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}