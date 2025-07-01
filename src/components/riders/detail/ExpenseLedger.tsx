
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";
import { formatCurrency } from "@/utils/dataUtils";
import { SpendEvent } from "@/types";
import { ViewReceiptDialog } from "./ViewReceiptDialog";

interface ExpenseLedgerProps {
  spendEvents: SpendEvent[];
  totalSpend: number;
}

export function ExpenseLedger({ spendEvents, totalSpend }: ExpenseLedgerProps) {
  const [viewingReceipt, setViewingReceipt] = useState<{
    open: boolean;
    url: string;
    description: string;
  }>({
    open: false,
    url: "",
    description: "",
  });

  const handleViewReceipt = (receiptUrl?: string, description?: string) => {
    if (receiptUrl) {
      setViewingReceipt({
        open: true,
        url: receiptUrl,
        description: description || "Receipt",
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Expense Ledger</CardTitle>
          <div className="text-lg font-medium">
            Total: {formatCurrency(totalSpend)}
          </div>
        </CardHeader>
        <CardContent>
          {spendEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No expenses recorded for this rider yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spendEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      {new Date(event.date).toLocaleDateString('en-AE')}
                    </TableCell>
                    <TableCell>
                      <div className="badge bg-nike-red/10 text-nike-red">
                        {event.category}
                      </div>
                    </TableCell>
                    <TableCell>{event.description}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(event.amountAed)}
                    </TableCell>
                    <TableCell>
                      {event.receiptUrl && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewReceipt(event.receiptUrl, event.description)}
                        >
                          <Download className="h-4 w-4 mr-1" /> View
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ViewReceiptDialog
        open={viewingReceipt.open}
        onClose={() => setViewingReceipt((prev) => ({ ...prev, open: false }))}
        receiptUrl={viewingReceipt.url}
        title={viewingReceipt.description}
      />
    </>
  );
}
