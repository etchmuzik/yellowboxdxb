
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, FileText, Plus } from "lucide-react";
import { formatCurrency } from "@/utils/dataUtils";
import { toast } from "@/components/ui/use-toast";
import { getAllRiders } from "@/services/riderService";
import { Rider } from "@/types";
import { exportReport } from "@/utils/exportUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AddVisaCostForm } from "./AddVisaCostForm";

export function VisaCostsContent() {
  const [isAddingCost, setIsAddingCost] = useState(false);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRiders = async () => {
      try {
        const data = await getAllRiders();
        setRiders(data);
      } catch (error) {
        console.error("Error fetching riders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRiders();
  }, []);

  // Get riders with visas
  const ridersWithVisas = riders.filter(rider => rider.visaNumber);

  const handleDownloadVisaReport = () => {
    try {
      exportReport("visa-status");
      toast({
        title: "Report downloaded successfully",
        description: "Your visa status report has been downloaded as a CSV file",
      });
    } catch (error) {
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
          <h1 className="text-3xl font-bold mb-1">Visa Costs Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage visa expenses for all riders
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownloadVisaReport}>
            <Download className="h-4 w-4 mr-1" /> Download Report
          </Button>
          <Dialog open={isAddingCost} onOpenChange={setIsAddingCost}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" /> Add Visa Cost
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Visa Cost</DialogTitle>
              </DialogHeader>
              <AddVisaCostForm onSuccess={() => setIsAddingCost(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visa Status Overview</CardTitle>
          <CardDescription>
            Current visa status and costs for all riders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rider</TableHead>
                <TableHead>Visa Number</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ridersWithVisas.map((rider) => {
                // Calculate a mock expiry date (1 year from now)
                const issueDate = new Date(rider.joinDate);
                const expiryDate = new Date(issueDate);
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                
                // Calculate days remaining
                const today = new Date();
                const daysRemaining = Math.round((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                
                // Determine visa status
                let status = "Valid";
                let statusClass = "bg-green-100 text-green-800";
                
                if (daysRemaining < 0) {
                  status = "Expired";
                  statusClass = "bg-red-100 text-red-800";
                } else if (daysRemaining < 30) {
                  status = "Expiring Soon";
                  statusClass = "bg-yellow-100 text-yellow-800";
                }
                
                return (
                  <TableRow key={rider.id}>
                    <TableCell>{rider.fullName}</TableCell>
                    <TableCell>{rider.visaNumber}</TableCell>
                    <TableCell>{issueDate.toLocaleDateString('en-AE')}</TableCell>
                    <TableCell>{expiryDate.toLocaleDateString('en-AE')}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${statusClass}`}>
                        {status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(3150)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Visa Expense Records</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Rider</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Filter to only visa expense records */}
              {riders.slice(0, 5).map((rider, index) => (
                <TableRow key={index}>
                  <TableCell>{new Date().toLocaleDateString('en-AE')}</TableCell>
                  <TableCell>{rider.fullName}</TableCell>
                  <TableCell>Work visa processing fee</TableCell>
                  <TableCell className="text-right">{formatCurrency(3150)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <FileText className="h-4 w-4 mr-1" /> View
                    </Button>
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
