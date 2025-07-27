import { SpendEvent, Budget, Rider } from '@/types';
import { format } from 'date-fns';
import { getAllExpenses } from '@/services/expenseService';
import { getAllRiders } from '@/services/riderService';
import { getAllBudgets } from '@/services/budgetService';

/**
 * Generates a monthly expense report in CSV format with real data
 */
export const generateMonthlyExpenseReportCSV = async (month: Date): Promise<string> => {
  const expenses = await getAllExpenses();
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  
  // Filter expenses for the selected month
  const monthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return expenseDate >= monthStart && expenseDate <= monthEnd;
  });
  
  let csvContent = 'Monthly Expense Summary\n';
  csvContent += `Month: ${format(month, 'MMMM yyyy')}\n\n`;
  
  // Headers
  csvContent += 'Category,Total Amount (AED),Number of Expenses,Average Amount (AED)\n';
  
  // Group by category
  const categoryTotals = monthExpenses.reduce<Record<string, { total: number; count: number }>>((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = { total: 0, count: 0 };
    }
    acc[expense.category].total += expense.amountAed;
    acc[expense.category].count += 1;
    return acc;
  }, {});
  
  // Add data
  Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b.total - a.total)
    .forEach(([category, data]) => {
      const average = data.total / data.count;
      csvContent += `${category},${data.total.toFixed(2)},${data.count},${average.toFixed(2)}\n`;
    });
  
  // Add totals
  const totalAmount = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.total, 0);
  const totalCount = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.count, 0);
  const totalAverage = totalCount > 0 ? totalAmount / totalCount : 0;
  
  csvContent += `\nTotals,${totalAmount.toFixed(2)},${totalCount},${totalAverage.toFixed(2)}\n`;
  csvContent += `\nReport generated on,${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n`;
  csvContent += `Timezone,Asia/Dubai\n`;
  
  return csvContent;
};

/**
 * Generates an expense details report in CSV format with real data
 */
export const generateExpenseDetailsReportCSV = async (): Promise<string> => {
  const [expenses, riders] = await Promise.all([
    getAllExpenses(),
    getAllRiders()
  ]);
  
  // Create rider lookup map
  const riderMap = new Map(riders.map(r => [r.id, r]));
  
  let csvContent = 'Expense Details Report\n\n';
  
  // Headers
  csvContent += 'Date,Rider ID,Rider Name,Category,Description,Amount (AED),Status,Receipt Available\n';
  
  // Sort expenses by date (newest first)
  const sortedExpenses = [...expenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  // Add data
  sortedExpenses.forEach(expense => {
    const rider = riderMap.get(expense.riderId);
    const riderName = rider ? rider.fullName : 'Unknown';
    const hasReceipt = expense.receiptUrl ? 'Yes' : 'No';
    const status = expense.status || 'pending';
    
    // Escape commas in description
    const description = expense.description.replace(/,/g, ';');
    
    csvContent += `${format(new Date(expense.date), 'yyyy-MM-dd')},${expense.riderId},"${riderName}",${expense.category},"${description}",${expense.amountAed.toFixed(2)},${status},${hasReceipt}\n`;
  });
  
  // Add totals
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amountAed, 0);
  csvContent += `\nTotal Amount,${totalAmount.toFixed(2)}\n`;
  csvContent += `Total Records,${expenses.length}\n`;
  csvContent += `\nReport generated on,${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n`;
  
  return csvContent;
};

/**
 * Generates a budget analysis report in CSV format with real data
 */
export const generateBudgetAnalysisReportCSV = async (): Promise<string> => {
  const [budgets, expenses] = await Promise.all([
    getAllBudgets(),
    getAllExpenses()
  ]);
  
  let csvContent = 'Budget Analysis Report\n\n';
  
  // Headers
  csvContent += 'Month,Budget (AED),Actual Spend (AED),Variance (AED),Variance (%)\n';
  
  // Sort budgets by month
  const sortedBudgets = [...budgets].sort((a, b) => a.month.localeCompare(b.month));
  
  // Calculate data for each budget
  const budgetData = sortedBudgets.map(budget => {
    // Filter expenses for this budget's month
    const monthExpenses = expenses.filter(expense => {
      const expenseMonth = format(new Date(expense.date), 'yyyy-MM');
      return expenseMonth === budget.month && expense.status === 'approved';
    });
    
    const spent = monthExpenses.reduce((sum, exp) => sum + exp.amountAed, 0);
    const budgetAmount = budget.totalBudget || budget.allocatedAed;
    const variance = budgetAmount - spent;
    const variancePercent = budgetAmount > 0 ? (variance / budgetAmount) * 100 : 0;
    
    return {
      month: budget.month,
      budget: budgetAmount,
      spent,
      variance,
      variancePercent
    };
  });
  
  // Add data
  budgetData.forEach(data => {
    csvContent += `${data.month},${data.budget.toFixed(2)},${data.spent.toFixed(2)},${data.variance.toFixed(2)},${data.variancePercent.toFixed(2)}%\n`;
  });
  
  // Add summary statistics
  const totalBudget = budgetData.reduce((sum, data) => sum + data.budget, 0);
  const totalSpent = budgetData.reduce((sum, data) => sum + data.spent, 0);
  const totalVariance = totalBudget - totalSpent;
  const totalVariancePercent = totalBudget > 0 ? (totalVariance / totalBudget) * 100 : 0;
  
  csvContent += `\nTotal,${totalBudget.toFixed(2)},${totalSpent.toFixed(2)},${totalVariance.toFixed(2)},${totalVariancePercent.toFixed(2)}%\n`;
  csvContent += `\nReport generated on,${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n`;
  
  return csvContent;
};

/**
 * Generates a category breakdown report in CSV format with real data
 */
export const generateCategoryBreakdownReportCSV = async (): Promise<string> => {
  const expenses = await getAllExpenses();
  
  let csvContent = 'Category Breakdown Report\n\n';
  
  // Get unique months from expenses
  const months = [...new Set(expenses.map(e => format(new Date(e.date), 'yyyy-MM')))].sort();
  const recentMonths = months.slice(-6); // Last 6 months
  
  // Headers
  csvContent += 'Category,' + recentMonths.map(m => format(new Date(m + '-01'), 'MMM yyyy')).join(',') + ',Total\n';
  
  // Get all categories
  const allCategories = [...new Set(expenses.map(e => e.category))];
  
  // Calculate data for each category
  const categoryData = allCategories.map(category => {
    const monthlyData: Record<string, number> = {};
    let total = 0;
    
    recentMonths.forEach(month => {
      const monthExpenses = expenses.filter(e => 
        e.category === category && 
        format(new Date(e.date), 'yyyy-MM') === month &&
        e.status === 'approved'
      );
      const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amountAed, 0);
      monthlyData[month] = monthTotal;
      total += monthTotal;
    });
    
    return { category, monthlyData, total };
  });
  
  // Sort by total descending
  categoryData.sort((a, b) => b.total - a.total);
  
  // Add data
  categoryData.forEach(({ category, monthlyData, total }) => {
    const monthValues = recentMonths.map(m => monthlyData[m]?.toFixed(2) || '0.00').join(',');
    csvContent += `${category},${monthValues},${total.toFixed(2)}\n`;
  });
  
  // Calculate column totals
  const monthTotals = recentMonths.map(month => {
    return expenses
      .filter(e => format(new Date(e.date), 'yyyy-MM') === month && e.status === 'approved')
      .reduce((sum, e) => sum + e.amountAed, 0);
  });
  const grandTotal = monthTotals.reduce((sum, t) => sum + t, 0);
  
  // Add totals row
  csvContent += `Total,${monthTotals.map(t => t.toFixed(2)).join(',')},${grandTotal.toFixed(2)}\n`;
  csvContent += `\nReport generated on,${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n`;
  
  return csvContent;
};

/**
 * Generates a rider progress report in CSV format with real data
 */
export const generateRiderProgressReportCSV = async (): Promise<string> => {
  const riders = await getAllRiders();
  
  let csvContent = 'Rider Progress Summary Report\n\n';
  csvContent += 'Rider ID,Rider Name,Nationality,Application Stage,Theory Test,Road Test,Medical Test,Join Date,Days in Process\n';
  
  // Sort riders by join date (newest first)
  const sortedRiders = [...riders].sort((a, b) => 
    new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
  );
  
  sortedRiders.forEach(rider => {
    const daysInProcess = Math.floor(
      (new Date().getTime() - new Date(rider.joinDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    csvContent += `${rider.id},"${rider.fullName}",${rider.nationality},${rider.applicationStage},${rider.testStatus.theory},${rider.testStatus.road},${rider.testStatus.medical},${format(new Date(rider.joinDate), 'yyyy-MM-dd')},${daysInProcess}\n`;
  });
  
  // Add summary
  const activeRiders = riders.filter(r => r.applicationStage === 'Active').length;
  const inProgressRiders = riders.filter(r => r.applicationStage !== 'Active').length;
  
  csvContent += `\nSummary\n`;
  csvContent += `Total Riders,${riders.length}\n`;
  csvContent += `Active Riders,${activeRiders}\n`;
  csvContent += `In Progress,${inProgressRiders}\n`;
  csvContent += `\nReport generated on,${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n`;
  
  return csvContent;
};

/**
 * Helper function to trigger CSV download
 */
export const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};