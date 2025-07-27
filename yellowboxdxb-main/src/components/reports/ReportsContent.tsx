
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText } from "lucide-react";
import { formatCurrency } from "@/utils/dataUtils";
import { exportReport } from "@/utils/exportUtils";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function ReportsContent() {
  const [activeTab, setActiveTab] = useState("expense");
  const { isFinance } = useAuth();

  const handleDownloadReport = (reportType: string) => {
    try {
      exportReport(reportType);
      toast({
        title: "Report downloaded successfully",
        description: "Your report has been downloaded as a CSV file",
      });
    } catch (error) {
      console.error(`Error exporting report: ${error}`);
      toast({
        title: "Error exporting report",
        description: "There was a problem generating your report. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">Reports</h1>
          <p className="text-muted-foreground">
            Generate and download reports for riders and expenses
          </p>
        </div>
        
        {isFinance() && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-green-600">
              Finance Officers: Full Export Access
            </span>
            <Button variant="outline" onClick={() => handleDownloadReport("finance-complete")}>
              <Download className="h-4 w-4 mr-2" />
              Export All Data
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="expense" onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="expense">Expense Reports</TabsTrigger>
          <TabsTrigger value="rider">Rider Reports</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="expense" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReportCard
              title="Monthly Expense Summary"
              description="Summary of all expenses grouped by category for the current month"
              icon={<FileText className="h-10 w-10 text-nike-red" />}
              onDownload={() => handleDownloadReport("monthly-expense")}
              stats={[
                { label: "Total Expenses", value: formatCurrency(24750) },
                { label: "Categories", value: "7" },
              ]}
            />
            
            <ReportCard
              title="Expense Details"
              description="Detailed list of all expenses with rider information"
              icon={<FileText className="h-10 w-10 text-nike-red" />}
              onDownload={() => handleDownloadReport("expense-details")}
              stats={[
                { label: "Total Records", value: "42" },
                { label: "Date Range", value: "All time" },
              ]}
            />
            
            <ReportCard
              title="Budget Analysis"
              description="Comparison of actual expenses against budget allocations"
              icon={<FileText className="h-10 w-10 text-nike-red" />}
              onDownload={() => handleDownloadReport("budget-analysis")}
              stats={[
                { label: "Budget", value: formatCurrency(30000) },
                { label: "Remaining", value: formatCurrency(5250) },
              ]}
            />
            
            <ReportCard
              title="Category Breakdown"
              description="Detailed breakdown of expenses by category with trends"
              icon={<FileText className="h-10 w-10 text-nike-red" />}
              onDownload={() => handleDownloadReport("category-breakdown")}
              stats={[
                { label: "Top Category", value: "RTA Tests" },
                { label: "Amount", value: formatCurrency(8500) },
              ]}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="rider" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReportCard
              title="Rider Progress Summary"
              description="Overview of all riders' application stages and test statuses"
              icon={<FileText className="h-10 w-10 text-nike-red" />}
              onDownload={() => handleDownloadReport("rider-progress")}
              stats={[
                { label: "Total Riders", value: "24" },
                { label: "Active Riders", value: "18" },
              ]}
            />
            
            <ReportCard
              title="Test Results Analysis"
              description="Pass/fail rates and trends for theory, road, and medical tests"
              icon={<FileText className="h-10 w-10 text-nike-red" />}
              onDownload={() => handleDownloadReport("test-results")}
              stats={[
                { label: "Pass Rate", value: "82%" },
                { label: "Tests Completed", value: "56" },
              ]}
            />
            
            <ReportCard
              title="Rider Expense Log"
              description="Individual expense logs for each rider with totals"
              icon={<FileText className="h-10 w-10 text-nike-red" />}
              onDownload={() => handleDownloadReport("rider-expense-log")}
              stats={[
                { label: "Avg. Spend/Rider", value: formatCurrency(1250) },
                { label: "Max Spend", value: formatCurrency(2300) },
              ]}
            />
            
            <ReportCard
              title="Onboarding Timeline"
              description="Average time spent in each stage of the onboarding process"
              icon={<FileText className="h-10 w-10 text-nike-red" />}
              onDownload={() => handleDownloadReport("onboarding-timeline")}
              stats={[
                { label: "Avg. Time", value: "31 days" },
                { label: "Fastest", value: "14 days" },
              ]}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="compliance" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ReportCard
              title="Document Compliance"
              description="Status report on required documents for each rider"
              icon={<FileText className="h-10 w-10 text-nike-red" />}
              onDownload={() => handleDownloadReport("document-compliance")}
              stats={[
                { label: "Compliance Rate", value: "94%" },
                { label: "Missing Docs", value: "7" },
              ]}
            />
            
            <ReportCard
              title="Visa Status Report"
              description="Current visa status and expiration dates for all riders"
              icon={<FileText className="h-10 w-10 text-nike-red" />}
              onDownload={() => handleDownloadReport("visa-status")}
              stats={[
                { label: "Valid Visas", value: "21" },
                { label: "Expiring Soon", value: "3" },
              ]}
            />
            
            <ReportCard
              title="Medical Certificate Audit"
              description="Status and validity of medical certificates for all riders"
              icon={<FileText className="h-10 w-10 text-nike-red" />}
              onDownload={() => handleDownloadReport("medical-audit")}
              stats={[
                { label: "Valid Certificates", value: "19" },
                { label: "Expired", value: "2" },
              ]}
            />
            
            <ReportCard
              title="Receipt Verification"
              description="Verification status of expense receipts for audit purposes"
              icon={<FileText className="h-10 w-10 text-nike-red" />}
              onDownload={() => handleDownloadReport("receipt-verification")}
              stats={[
                { label: "Verified", value: "38" },
                { label: "Pending", value: "4" },
              ]}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onDownload: () => void;
  stats: { label: string; value: string }[];
}

function ReportCard({ title, description, icon, onDownload, stats }: ReportCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {icon}
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-sm text-muted-foreground">{stat.label}</div>
              <div className="text-xl font-medium">{stat.value}</div>
            </div>
          ))}
        </div>
        <Button className="w-full" onClick={onDownload}>
          <Download className="mr-2 h-4 w-4" /> Download Report
        </Button>
      </CardContent>
    </Card>
  );
}
