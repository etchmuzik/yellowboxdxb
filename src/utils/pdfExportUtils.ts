import jsPDF from 'jspdf';
import { SpendEvent, Budget, Rider } from '@/types';
import { formatCurrency } from '@/utils/dataUtils';
import { format } from 'date-fns';

// Yellow Box brand colors
const BRAND_COLORS = {
  primary: '#FFD700', // Yellow
  secondary: '#1a1a1a', // Dark
  accent: '#FF6B00', // Orange
  text: '#333333',
  lightGray: '#f5f5f5'
};

/**
 * Adds Yellow Box header to PDF
 */
const addHeader = (doc: jsPDF, title: string) => {
  // Yellow header background
  doc.setFillColor(BRAND_COLORS.primary);
  doc.rect(0, 0, 210, 30, 'F');
  
  // Company name
  doc.setFontSize(20);
  doc.setTextColor(BRAND_COLORS.secondary);
  doc.text('YELLOW BOX', 15, 15);
  
  // Report title
  doc.setFontSize(14);
  doc.text(title, 15, 25);
  
  // Reset text color
  doc.setTextColor(BRAND_COLORS.text);
};

/**
 * Adds footer with page numbers
 */
const addFooter = (doc: jsPDF, pageNumber: number) => {
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(
    `Page ${pageNumber} | Generated on ${format(new Date(), 'dd MMM yyyy HH:mm')}`,
    105,
    pageHeight - 10,
    { align: 'center' }
  );
};

/**
 * Exports monthly expense report as PDF
 */
export const exportMonthlyExpensePDF = (
  expenses: SpendEvent[],
  budget: Budget | undefined,
  month: Date
) => {
  const doc = new jsPDF();
  
  // Add header
  addHeader(doc, `Monthly Expense Report - ${format(month, 'MMMM yyyy')}`);
  
  let yPosition = 40;
  
  // Summary section
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Summary', 15, yPosition);
  yPosition += 10;
  
  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amountAed, 0);
  const approvedExpenses = expenses.filter(e => e.status === 'approved');
  const pendingExpenses = expenses.filter(e => e.status === 'pending');
  const rejectedExpenses = expenses.filter(e => e.status === 'rejected');
  
  const totalApproved = approvedExpenses.reduce((sum, exp) => sum + exp.amountAed, 0);
  const totalPending = pendingExpenses.reduce((sum, exp) => sum + exp.amountAed, 0);
  const totalRejected = rejectedExpenses.reduce((sum, exp) => sum + exp.amountAed, 0);
  
  // Summary box
  doc.setFillColor(BRAND_COLORS.lightGray);
  doc.rect(15, yPosition, 180, 40, 'F');
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Total Budget: ${formatCurrency(budget?.totalBudget || 0)}`, 20, yPosition + 10);
  doc.text(`Total Expenses: ${formatCurrency(totalExpenses)}`, 20, yPosition + 20);
  doc.text(`Remaining: ${formatCurrency((budget?.totalBudget || 0) - totalApproved)}`, 20, yPosition + 30);
  
  doc.text(`Approved: ${formatCurrency(totalApproved)} (${approvedExpenses.length})`, 110, yPosition + 10);
  doc.text(`Pending: ${formatCurrency(totalPending)} (${pendingExpenses.length})`, 110, yPosition + 20);
  doc.text(`Rejected: ${formatCurrency(totalRejected)} (${rejectedExpenses.length})`, 110, yPosition + 30);
  
  yPosition += 50;
  
  // Expenses by category
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Expenses by Category', 15, yPosition);
  yPosition += 10;
  
  // Group by category
  const categoryTotals = expenses.reduce<Record<string, { count: number; total: number }>>((acc, expense) => {
    if (!acc[expense.category]) {
      acc[expense.category] = { count: 0, total: 0 };
    }
    acc[expense.category].count += 1;
    acc[expense.category].total += expense.amountAed;
    return acc;
  }, {});
  
  // Category table headers
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('Category', 20, yPosition);
  doc.text('Count', 100, yPosition);
  doc.text('Total Amount', 140, yPosition);
  
  doc.line(15, yPosition + 2, 195, yPosition + 2);
  yPosition += 8;
  
  doc.setFont(undefined, 'normal');
  Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b.total - a.total)
    .forEach(([category, data]) => {
      doc.text(category, 20, yPosition);
      doc.text(data.count.toString(), 100, yPosition);
      doc.text(formatCurrency(data.total), 140, yPosition);
      yPosition += 6;
      
      // Add new page if needed
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
    });
  
  // Add footer
  addFooter(doc, 1);
  
  // Save the PDF
  doc.save(`expense_report_${format(month, 'yyyy-MM')}.pdf`);
};

/**
 * Exports individual rider expense report as PDF
 */
export const exportRiderExpensePDF = (rider: Rider, expenses: SpendEvent[]) => {
  const doc = new jsPDF();
  
  // Add header
  addHeader(doc, 'Rider Expense Report');
  
  let yPosition = 40;
  
  // Rider information
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Rider Information', 15, yPosition);
  yPosition += 10;
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Name: ${rider.fullName}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Email: ${rider.email}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Phone: ${rider.phone}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Nationality: ${rider.nationality}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Application Stage: ${rider.applicationStage}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Join Date: ${format(new Date(rider.joinDate), 'dd MMM yyyy')}`, 20, yPosition);
  yPosition += 15;
  
  // Expense summary
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amountAed, 0);
  
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Expense Summary', 15, yPosition);
  yPosition += 10;
  
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Total Expenses: ${formatCurrency(totalExpenses)}`, 20, yPosition);
  doc.text(`Number of Expenses: ${expenses.length}`, 100, yPosition);
  yPosition += 15;
  
  // Expense details
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Expense Details', 15, yPosition);
  yPosition += 10;
  
  // Table headers
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('Date', 20, yPosition);
  doc.text('Category', 50, yPosition);
  doc.text('Description', 90, yPosition);
  doc.text('Amount', 160, yPosition);
  
  doc.line(15, yPosition + 2, 195, yPosition + 2);
  yPosition += 8;
  
  // Sort expenses by date
  const sortedExpenses = [...expenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  doc.setFont(undefined, 'normal');
  sortedExpenses.forEach((expense, index) => {
    doc.text(format(new Date(expense.date), 'dd/MM/yyyy'), 20, yPosition);
    doc.text(expense.category.substring(0, 15), 50, yPosition);
    
    // Truncate description if too long
    const description = expense.description.length > 30 
      ? expense.description.substring(0, 30) + '...' 
      : expense.description;
    doc.text(description, 90, yPosition);
    
    doc.text(formatCurrency(expense.amountAed), 160, yPosition);
    yPosition += 6;
    
    // Add new page if needed
    if (yPosition > 270) {
      doc.addPage();
      addFooter(doc, Math.floor(index / 40) + 1);
      yPosition = 20;
    }
  });
  
  // Add total line
  yPosition += 5;
  doc.line(15, yPosition, 195, yPosition);
  yPosition += 6;
  doc.setFont(undefined, 'bold');
  doc.text('Total', 20, yPosition);
  doc.text(formatCurrency(totalExpenses), 160, yPosition);
  
  // Add footer
  addFooter(doc, 1);
  
  // Save the PDF
  doc.save(`rider_${rider.id}_expenses.pdf`);
};

/**
 * Exports budget analysis report as PDF
 */
export const exportBudgetAnalysisPDF = (
  budgets: Budget[],
  expenses: SpendEvent[],
  startDate: Date,
  endDate: Date
) => {
  const doc = new jsPDF();
  
  // Add header
  addHeader(doc, `Budget Analysis Report`);
  
  let yPosition = 40;
  
  // Report period
  doc.setFontSize(12);
  doc.text(
    `Period: ${format(startDate, 'MMM yyyy')} - ${format(endDate, 'MMM yyyy')}`,
    15,
    yPosition
  );
  yPosition += 15;
  
  // Summary section
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Budget Overview', 15, yPosition);
  yPosition += 10;
  
  // Calculate totals across all months
  const totalBudget = budgets.reduce((sum, b) => sum + (b.totalBudget || b.allocatedAed), 0);
  const totalSpent = expenses
    .filter(e => e.status === 'approved')
    .reduce((sum, e) => sum + e.amountAed, 0);
  const variance = totalBudget - totalSpent;
  const variancePercent = totalBudget > 0 ? (variance / totalBudget) * 100 : 0;
  
  // Summary box
  doc.setFillColor(BRAND_COLORS.lightGray);
  doc.rect(15, yPosition, 180, 30, 'F');
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Total Budget: ${formatCurrency(totalBudget)}`, 20, yPosition + 10);
  doc.text(`Total Spent: ${formatCurrency(totalSpent)}`, 20, yPosition + 20);
  
  const varianceColor = variance >= 0 ? 'green' : 'red';
  doc.setTextColor(varianceColor === 'green' ? 0 : 255, varianceColor === 'green' ? 150 : 0, 0);
  doc.text(
    `Variance: ${formatCurrency(Math.abs(variance))} (${variancePercent.toFixed(1)}%)`,
    110,
    yPosition + 15
  );
  doc.setTextColor(BRAND_COLORS.text);
  
  yPosition += 40;
  
  // Monthly breakdown
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Monthly Breakdown', 15, yPosition);
  yPosition += 10;
  
  // Table headers
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('Month', 20, yPosition);
  doc.text('Budget', 60, yPosition);
  doc.text('Spent', 95, yPosition);
  doc.text('Variance', 130, yPosition);
  doc.text('%', 170, yPosition);
  
  doc.line(15, yPosition + 2, 195, yPosition + 2);
  yPosition += 8;
  
  doc.setFont(undefined, 'normal');
  budgets.forEach((budget) => {
    const monthExpenses = expenses.filter(e => {
      const expenseMonth = format(new Date(e.date), 'yyyy-MM');
      return expenseMonth === budget.month && e.status === 'approved';
    });
    
    const monthSpent = monthExpenses.reduce((sum, e) => sum + e.amountAed, 0);
    const monthBudget = budget.totalBudget || budget.allocatedAed;
    const monthVariance = monthBudget - monthSpent;
    const monthVariancePercent = monthBudget > 0 ? (monthVariance / monthBudget) * 100 : 0;
    
    doc.text(format(new Date(budget.month + '-01'), 'MMM yyyy'), 20, yPosition);
    doc.text(formatCurrency(monthBudget), 60, yPosition);
    doc.text(formatCurrency(monthSpent), 95, yPosition);
    
    // Color variance based on positive/negative
    if (monthVariance < 0) {
      doc.setTextColor(255, 0, 0);
    }
    doc.text(formatCurrency(Math.abs(monthVariance)), 130, yPosition);
    doc.text(`${monthVariancePercent.toFixed(1)}%`, 170, yPosition);
    
    if (monthVariance < 0) {
      doc.setTextColor(BRAND_COLORS.text);
    }
    
    yPosition += 6;
  });
  
  // Add footer
  addFooter(doc, 1);
  
  // Save the PDF
  doc.save(`budget_analysis_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

/**
 * Exports financial summary report as PDF
 */
export const exportFinancialSummaryPDF = (
  expenses: SpendEvent[],
  budgets: Budget[],
  riders: Rider[]
) => {
  const doc = new jsPDF();
  
  // Add header
  addHeader(doc, 'Financial Summary Report');
  
  let yPosition = 40;
  
  // Executive summary
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Executive Summary', 15, yPosition);
  yPosition += 10;
  
  const activeRiders = riders.filter(r => r.applicationStage === 'Active').length;
  const totalRiders = riders.length;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amountAed, 0);
  const avgExpensePerRider = totalRiders > 0 ? totalExpenses / totalRiders : 0;
  
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(`Total Riders: ${totalRiders} (${activeRiders} active)`, 20, yPosition);
  yPosition += 8;
  doc.text(`Total Expenses: ${formatCurrency(totalExpenses)}`, 20, yPosition);
  yPosition += 8;
  doc.text(`Average Expense per Rider: ${formatCurrency(avgExpensePerRider)}`, 20, yPosition);
  yPosition += 15;
  
  // Top spending categories
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Top Spending Categories', 15, yPosition);
  yPosition += 10;
  
  // Calculate category totals
  const categoryTotals = expenses.reduce<Record<string, number>>((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amountAed;
    return acc;
  }, {});
  
  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  
  doc.setFontSize(10);
  sortedCategories.forEach(([category, total], index) => {
    const percentage = (total / totalExpenses) * 100;
    doc.text(`${index + 1}. ${category}: ${formatCurrency(total)} (${percentage.toFixed(1)}%)`, 20, yPosition);
    yPosition += 6;
  });
  
  // Add footer
  addFooter(doc, 1);
  
  // Save the PDF
  doc.save(`financial_summary_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}