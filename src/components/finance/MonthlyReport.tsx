import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SpendEvent, Budget } from '@/types';
import { format } from 'date-fns';
import { formatCurrency } from '@/utils/dataUtils';
import { Download, FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { exportMonthlyExpensePDF } from '@/utils/pdfExportUtils';
import { toast } from '@/components/ui/use-toast';

interface MonthlyReportProps {
  selectedMonth: Date;
  expenses: SpendEvent[];
  budget?: Budget;
}

export function MonthlyReport({ selectedMonth, expenses, budget }: MonthlyReportProps) {
  const approvedExpenses = expenses.filter(exp => exp.status === 'approved');
  const rejectedExpenses = expenses.filter(exp => exp.status === 'rejected');
  const pendingExpenses = expenses.filter(exp => exp.status === 'pending');

  const totalApproved = approvedExpenses.reduce((sum, exp) => sum + exp.amountAed, 0);
  const totalRejected = rejectedExpenses.reduce((sum, exp) => sum + exp.amountAed, 0);
  const totalPending = pendingExpenses.reduce((sum, exp) => sum + exp.amountAed, 0);

  // Group by category
  const categoryTotals = approvedExpenses.reduce<Record<string, { count: number; total: number }>>(
    (acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = { count: 0, total: 0 };
      }
      acc[expense.category].count += 1;
      acc[expense.category].total += expense.amountAed;
      return acc;
    },
    {}
  );

  // Group by rider
  const riderTotals = approvedExpenses.reduce<Record<string, { name: string; total: number; count: number }>>(
    (acc, expense) => {
      const riderId = expense.riderId;
      if (!acc[riderId]) {
        acc[riderId] = { 
          name: expense.riderName || 'Unknown', 
          total: 0, 
          count: 0 
        };
      }
      acc[riderId].total += expense.amountAed;
      acc[riderId].count += 1;
      return acc;
    },
    {}
  );

  const handleExportPDF = () => {
    try {
      exportMonthlyExpensePDF(expenses, budget, selectedMonth);
      toast({
        title: 'PDF Exported',
        description: 'Monthly expense report has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleExportCSV = () => {
    try {
      // Create CSV content
      let csvContent = 'Monthly Expense Report\n';
      csvContent += `Month: ${format(selectedMonth, 'MMMM yyyy')}\n\n`;
      
      // Summary
      csvContent += 'Summary\n';
      csvContent += `Total Budget,${budget?.totalBudget || 0}\n`;
      csvContent += `Approved Expenses,${totalApproved}\n`;
      csvContent += `Pending Expenses,${totalPending}\n`;
      csvContent += `Rejected Expenses,${totalRejected}\n\n`;
      
      // Expenses by Category
      csvContent += 'Expenses by Category\n';
      csvContent += 'Category,Count,Total Amount,Average\n';
      
      Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b.total - a.total)
        .forEach(([category, data]) => {
          csvContent += `${category},${data.count},${data.total},${(data.total / data.count).toFixed(2)}\n`;
        });
      
      csvContent += '\nTop Riders by Expense\n';
      csvContent += 'Rider,Expense Count,Total Amount\n';
      
      Object.entries(riderTotals)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 10)
        .forEach(([, data]) => {
          csvContent += `"${data.name}",${data.count},${data.total}\n`;
        });
      
      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `expense_report_${format(selectedMonth, 'yyyy-MM')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'CSV Exported',
        description: 'Monthly expense report has been downloaded successfully.',
      });
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export CSV. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Monthly Report - {format(selectedMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(budget?.totalBudget || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalApproved)}
            </div>
            <p className="text-xs text-muted-foreground">
              {approvedExpenses.length} expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(totalPending)}
            </div>
            <p className="text-xs text-muted-foreground">
              {pendingExpenses.length} expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalRejected)}
            </div>
            <p className="text-xs text-muted-foreground">
              {rejectedExpenses.length} expenses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Average</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(categoryTotals)
                .sort(([, a], [, b]) => b.total - a.total)
                .map(([category, data]) => (
                  <TableRow key={category}>
                    <TableCell>{category}</TableCell>
                    <TableCell className="text-right">{data.count}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(data.total)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(data.total / data.count)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Riders by Expense */}
      <Card>
        <CardHeader>
          <CardTitle>Top Riders by Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rider</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(riderTotals)
                .sort(([, a], [, b]) => b.total - a.total)
                .slice(0, 10)
                .map(([riderId, data]) => (
                  <TableRow key={riderId}>
                    <TableCell>{data.name}</TableCell>
                    <TableCell className="text-right">{data.count}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(data.total)}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}