
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Download, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { AddExpenseForm } from "./AddExpenseForm";
import { toast } from "@/components/ui/sonner";
import { exportRiderData } from "@/utils/exportUtils";
import { Rider, SpendEvent } from "@/types";
import { useAuth } from "@/hooks/use-auth";

interface RiderHeaderProps {
  fullName: string;
  email: string;
  phone: string;
  riderId: string;
  rider: Rider;
  expenses: SpendEvent[];
}

export function RiderHeader({ fullName, email, phone, riderId, rider, expenses }: RiderHeaderProps) {
  const navigate = useNavigate();
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const { currentUser } = useAuth();
  
  const isAdmin = currentUser?.role === 'Admin';
  const isFinance = currentUser?.role === 'Finance';
  
  const handleExportData = async () => {
    try {
      exportRiderData(rider, expenses);
      toast.success("Rider data exported successfully");
    } catch (error) {
      toast.error("Failed to export rider data");
      console.error("Export error:", error);
    }
  };
  
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Button
            variant="outline"
            className="mb-2"
            onClick={() => navigate("/riders")}
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Back to Riders
          </Button>
          <h2 className="text-2xl font-medium">{fullName}</h2>
          <p className="text-muted-foreground">{email} • {phone}</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" /> Export Data
          </Button>
          {(isAdmin || isFinance) && (
            <Button onClick={() => setIsAddExpenseOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Expense
            </Button>
          )}
        </div>
      </div>

      <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Expense for {fullName}</DialogTitle>
          </DialogHeader>
          <AddExpenseForm 
            riderId={riderId}
            onSuccess={() => setIsAddExpenseOpen(false)} 
            onCancel={() => setIsAddExpenseOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
