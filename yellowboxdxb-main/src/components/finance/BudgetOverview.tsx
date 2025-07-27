import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Budget, SpendEvent, SpendCategory } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { formatCurrency } from '@/utils/dataUtils';
import { Progress } from '@/components/ui/progress';

interface BudgetOverviewProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  budgets: Budget[];
  expenses: SpendEvent[];
}

export function BudgetOverview({ 
  selectedMonth, 
  onMonthChange, 
  budgets, 
  expenses 
}: BudgetOverviewProps) {
  const currentMonthBudget = budgets.find(budget => {
    const budgetDate = new Date(budget.month);
    return budgetDate.getMonth() === selectedMonth.getMonth() && 
           budgetDate.getFullYear() === selectedMonth.getFullYear();
  });

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const monthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= monthStart && expenseDate <= monthEnd && expense.status === 'approved';
  });

  // Group expenses by category
  const expensesByCategory = monthExpenses.reduce<Record<SpendCategory, number>>((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = 0;
    }
    acc[expense.category] += expense.amountAed;
    return acc;
  }, {} as Record<SpendCategory, number>);

  const totalSpent = Object.values(expensesByCategory).reduce((sum, amount) => sum + amount, 0);
  const totalBudget = currentMonthBudget?.totalBudget || 0;

  const categoryBudgets: Record<SpendCategory, number> = currentMonthBudget?.categoryBudgets || {
    'Visa Fees': 0,
    'RTA Tests': 0,
    'Medical': 0,
    'Medical Test': 0,
    'Emirates ID': 0,
    'RTA Theory Test': 0,
    'RTA Road Test': 0,
    'Eye Test': 0,
    'Bike Maintenance': 0,
    'Residency ID': 0,
    'Training': 0,
    'Uniform': 0,
    'Insurance': 0,
    'Fuel': 0,
    'Other': 0
  };

  const handlePreviousMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Budget Overview</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium px-4">
            {format(selectedMonth, 'MMMM yyyy')}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Budget Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Spent</span>
              <span className="font-medium">{formatCurrency(totalSpent)}</span>
            </div>
            <Progress 
              value={totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0} 
              className="h-3"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}%` : '0%'} used</span>
              <span>Budget: {formatCurrency(totalBudget)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(categoryBudgets).map(([category, budget]) => {
          const spent = expensesByCategory[category as SpendCategory] || 0;
          const percentage = budget > 0 ? (spent / budget) * 100 : 0;
          const isOverBudget = spent > budget;

          return (
            <Card key={category} className={isOverBudget ? 'border-red-500' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Spent</span>
                    <span className={`font-medium ${isOverBudget ? 'text-red-600' : ''}`}>
                      {formatCurrency(spent)}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className={`h-2 ${isOverBudget ? 'bg-red-100' : ''}`}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{percentage.toFixed(1)}% used</span>
                    <span>Budget: {formatCurrency(budget)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}