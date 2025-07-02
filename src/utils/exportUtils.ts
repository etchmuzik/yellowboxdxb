
import { Rider, SpendEvent, Budget } from "@/types";
import { formatCurrency } from "@/utils/dataUtils";
import { format } from "date-fns";

/**
 * Exports rider data and their expenses as a CSV file
 */
export const exportRiderData = (rider: Rider, expenses: SpendEvent[]): void => {
  // Format the data for CSV
  const totalSpend = expenses.reduce((acc, expense) => acc + expense.amountAed, 0);
  
  // Basic rider information
  let csvContent = "Rider Information\n";
  csvContent += `Name,${rider.fullName}\n`;
  csvContent += `Email,${rider.email}\n`;
  csvContent += `Phone,${rider.phone}\n`;
  csvContent += `Nationality,${rider.nationality}\n`;
  csvContent += `Bike Type,${rider.bikeType}\n`;
  csvContent += `Visa Number,${rider.visaNumber}\n`;
  csvContent += `Application Stage,${rider.applicationStage}\n`;
  csvContent += `Join Date,${new Date(rider.joinDate).toLocaleDateString('en-AE')}\n`;
  csvContent += `Expected Start,${new Date(rider.expectedStart).toLocaleDateString('en-AE')}\n`;
  csvContent += `Notes,${rider.notes.replace(/,/g, ';')}\n\n`;
  
  // Test statuses
  csvContent += "Test Statuses\n";
  csvContent += `Theory,${rider.testStatus.theory}\n`;
  csvContent += `Road,${rider.testStatus.road}\n`;
  csvContent += `Medical,${rider.testStatus.medical}\n\n`;
  
  // Expense information
  csvContent += "Expenses\n";
  csvContent += "Date,Category,Description,Amount (AED),Receipt URL\n";
  
  expenses.forEach(expense => {
    const date = new Date(expense.date).toLocaleDateString('en-AE');
    // Escape commas in description
    const description = expense.description.replace(/,/g, ';');
    const receiptUrl = expense.receiptUrl || 'None';
    
    csvContent += `${date},${expense.category},${description},${expense.amountAed},${receiptUrl}\n`;
  });
  
  // Add total
  csvContent += `\nTotal Expenses,${formatCurrency(totalSpend)}\n`;
  
  // Create and trigger download
  const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `rider_${rider.id}_data.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exports a report as a CSV file based on report type
 */
export const exportReport = (reportType: string): void => {
  let csvContent = '';
  let filename = '';
  
  switch (reportType) {
    case "monthly-expense":
      csvContent = generateMonthlyExpenseReport();
      filename = `monthly_expense_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      break;
    case "expense-details":
      csvContent = generateExpenseDetailsReport();
      filename = `expense_details_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      break;
    case "budget-analysis":
      csvContent = generateBudgetAnalysisReport();
      filename = `budget_analysis_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      break;
    case "category-breakdown":
      csvContent = generateCategoryBreakdownReport();
      filename = `category_breakdown_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      break;
    case "rider-progress":
      csvContent = generateRiderProgressReport();
      filename = `rider_progress_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      break;
    case "test-results":
      csvContent = generateTestResultsReport();
      filename = `test_results_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      break;
    case "rider-expense-log":
      csvContent = generateRiderExpenseLogReport();
      filename = `rider_expense_log_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      break;
    case "onboarding-timeline":
      csvContent = generateOnboardingTimelineReport();
      filename = `onboarding_timeline_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      break;
    case "document-compliance":
      csvContent = generateDocumentComplianceReport();
      filename = `document_compliance_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      break;
    case "visa-status":
      csvContent = generateVisaStatusReport();
      filename = `visa_status_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      break;
    case "medical-audit":
      csvContent = generateMedicalAuditReport();
      filename = `medical_audit_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      break;
    case "receipt-verification":
      csvContent = generateReceiptVerificationReport();
      filename = `receipt_verification_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      break;
    default:
      console.error(`Unknown report type: ${reportType}`);
      return;
  }
  
  // Create and trigger download
  const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generates a monthly expense report in CSV format
 */
const generateMonthlyExpenseReport = (): string => {
  // In a real app, this would fetch real data from an API
  let csvContent = "Monthly Expense Summary\n\n";
  
  // Headers
  csvContent += "Category,Total Amount (AED),Number of Expenses,Average Amount (AED)\n";
  
  // Sample data - would be replaced with real data in production
  const categories = [
    { name: "Visa Fees", total: 8500, count: 7, average: 1214.29 },
    { name: "RTA Tests", total: 8500, count: 15, average: 566.67 },
    { name: "Medical", total: 3500, count: 8, average: 437.50 },
    { name: "Residency ID", total: 2000, count: 4, average: 500 },
    { name: "Training", total: 1500, count: 3, average: 500 },
    { name: "Uniform", total: 750, count: 5, average: 150 }
  ];
  
  // Add data
  categories.forEach(category => {
    csvContent += `${category.name},${category.total.toFixed(2)},${category.count},${category.average.toFixed(2)}\n`;
  });
  
  // Add totals
  const totalAmount = categories.reduce((sum, cat) => sum + cat.total, 0);
  const totalCount = categories.reduce((sum, cat) => sum + cat.count, 0);
  const totalAverage = totalAmount / totalCount;
  
  csvContent += `\nTotals,${totalAmount.toFixed(2)},${totalCount},${totalAverage.toFixed(2)}\n`;
  csvContent += `\nReport generated on,${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n`;
  csvContent += `Timezone,Asia/Dubai\n`;
  
  return csvContent;
};

/**
 * Generates an expense details report in CSV format
 */
const generateExpenseDetailsReport = (): string => {
  let csvContent = "Expense Details Report\n\n";
  
  // Headers
  csvContent += "Date,Rider ID,Rider Name,Category,Description,Amount (AED),Receipt Available\n";
  
  // Sample data - would be replaced with real data in production
  const expenses = [
    { date: "2023-05-01", riderId: "R001", riderName: "Ahmad Al Farsi", category: "Visa Fees", description: "Entry Permit", amount: 1500, hasReceipt: true },
    { date: "2023-05-02", riderId: "R002", riderName: "Mohammed Khan", category: "RTA Tests", description: "Theory Test Fee", amount: 200, hasReceipt: true },
    { date: "2023-05-03", riderId: "R003", riderName: "Fatima Zaidi", category: "Medical", description: "Medical Examination", amount: 500, hasReceipt: true },
    { date: "2023-05-04", riderId: "R001", riderName: "Ahmad Al Farsi", category: "Residency ID", description: "Emirates ID Application", amount: 500, hasReceipt: false },
    { date: "2023-05-05", riderId: "R004", riderName: "Raj Kumar", category: "Training", description: "Safety Training", amount: 750, hasReceipt: true }
  ];
  
  // Add data
  expenses.forEach(expense => {
    csvContent += `${expense.date},${expense.riderId},${expense.riderName},${expense.category},${expense.description},${expense.amount.toFixed(2)},${expense.hasReceipt ? "Yes" : "No"}\n`;
  });
  
  // Add totals
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  csvContent += `\nTotal Amount,${totalAmount.toFixed(2)}\n`;
  csvContent += `Total Records,${expenses.length}\n`;
  csvContent += `\nReport generated on,${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n`;
  
  return csvContent;
};

/**
 * Generates a budget analysis report in CSV format
 */
const generateBudgetAnalysisReport = (): string => {
  let csvContent = "Budget Analysis Report\n\n";
  
  // Headers
  csvContent += "Month,Budget (AED),Actual Spend (AED),Variance (AED),Variance (%)\n";
  
  // Sample data - would be replaced with real data in production
  const budgetData = [
    { month: "2023-01", budget: 30000, spent: 28500, variance: 1500, variancePercent: 5 },
    { month: "2023-02", budget: 30000, spent: 32000, variance: -2000, variancePercent: -6.67 },
    { month: "2023-03", budget: 35000, spent: 34000, variance: 1000, variancePercent: 2.86 },
    { month: "2023-04", budget: 35000, spent: 36200, variance: -1200, variancePercent: -3.43 },
    { month: "2023-05", budget: 40000, spent: 38500, variance: 1500, variancePercent: 3.75 }
  ];
  
  // Add data
  budgetData.forEach(data => {
    csvContent += `${data.month},${data.budget.toFixed(2)},${data.spent.toFixed(2)},${data.variance.toFixed(2)},${data.variancePercent.toFixed(2)}%\n`;
  });
  
  // Add summary statistics
  const totalBudget = budgetData.reduce((sum, data) => sum + data.budget, 0);
  const totalSpent = budgetData.reduce((sum, data) => sum + data.spent, 0);
  const totalVariance = totalBudget - totalSpent;
  const totalVariancePercent = (totalVariance / totalBudget) * 100;
  
  csvContent += `\nTotal,${totalBudget.toFixed(2)},${totalSpent.toFixed(2)},${totalVariance.toFixed(2)},${totalVariancePercent.toFixed(2)}%\n`;
  csvContent += `\nReport generated on,${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n`;
  
  return csvContent;
};

/**
 * Generates a category breakdown report in CSV format
 */
const generateCategoryBreakdownReport = (): string => {
  let csvContent = "Category Breakdown Report\n\n";
  
  // Headers
  csvContent += "Category,January,February,March,April,May,Total\n";
  
  // Sample data - would be replaced with real data in production
  const categoryData = [
    { category: "Visa Fees", jan: 3500, feb: 2500, mar: 4000, apr: 3000, may: 3500 },
    { category: "RTA Tests", jan: 2000, feb: 3000, mar: 1500, apr: 2500, may: 3500 },
    { category: "Medical", jan: 1500, feb: 1000, mar: 2000, apr: 1500, may: 2000 },
    { category: "Residency ID", jan: 1000, feb: 1500, mar: 500, apr: 2000, may: 1000 },
    { category: "Training", jan: 500, feb: 1000, mar: 1500, apr: 1000, may: 1500 }
  ];
  
  // Calculate totals for each category
  const categoriesWithTotals = categoryData.map(cat => ({
    ...cat,
    total: cat.jan + cat.feb + cat.mar + cat.apr + cat.may
  }));
  
  // Add data
  categoriesWithTotals.forEach(cat => {
    csvContent += `${cat.category},${cat.jan.toFixed(2)},${cat.feb.toFixed(2)},${cat.mar.toFixed(2)},${cat.apr.toFixed(2)},${cat.may.toFixed(2)},${cat.total.toFixed(2)}\n`;
  });
  
  // Calculate column totals
  const janTotal = categoriesWithTotals.reduce((sum, cat) => sum + cat.jan, 0);
  const febTotal = categoriesWithTotals.reduce((sum, cat) => sum + cat.feb, 0);
  const marTotal = categoriesWithTotals.reduce((sum, cat) => sum + cat.mar, 0);
  const aprTotal = categoriesWithTotals.reduce((sum, cat) => sum + cat.apr, 0);
  const mayTotal = categoriesWithTotals.reduce((sum, cat) => sum + cat.may, 0);
  const grandTotal = categoriesWithTotals.reduce((sum, cat) => sum + cat.total, 0);
  
  // Add totals row
  csvContent += `Total,${janTotal.toFixed(2)},${febTotal.toFixed(2)},${marTotal.toFixed(2)},${aprTotal.toFixed(2)},${mayTotal.toFixed(2)},${grandTotal.toFixed(2)}\n`;
  csvContent += `\nReport generated on,${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n`;
  
  return csvContent;
};

// Placeholder functions for other report types
// In a real app, these would contain actual report generation logic
const generateRiderProgressReport = (): string => {
  // Implementation for rider progress report
  let csvContent = "Rider Progress Summary Report\n\n";
  csvContent += "Rider ID,Rider Name,Application Stage,Theory Test,Road Test,Medical Test,Days in Process\n";
  // Sample data would be added here
  return csvContent;
};

const generateTestResultsReport = (): string => {
  // Implementation for test results report
  const csvContent = "Test Results Analysis Report\n\n";
  return csvContent;
};

const generateRiderExpenseLogReport = (): string => {
  // Implementation for rider expense log report
  const csvContent = "Rider Expense Log Report\n\n";
  return csvContent;
};

const generateOnboardingTimelineReport = (): string => {
  // Implementation for onboarding timeline report
  const csvContent = "Onboarding Timeline Report\n\n";
  return csvContent;
};

const generateDocumentComplianceReport = (): string => {
  // Implementation for document compliance report
  const csvContent = "Document Compliance Report\n\n";
  return csvContent;
};

const generateVisaStatusReport = (): string => {
  // Implementation for visa status report
  const csvContent = "Visa Status Report\n\n";
  return csvContent;
};

const generateMedicalAuditReport = (): string => {
  // Implementation for medical audit report
  const csvContent = "Medical Certificate Audit Report\n\n";
  return csvContent;
};

const generateReceiptVerificationReport = (): string => {
  // Implementation for receipt verification report
  const csvContent = "Receipt Verification Report\n\n";
  return csvContent;
};
