
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

interface Expense {
  id: string;
  category: string;
  date: string;
  amount: number;
  description: string;
}

interface SpendHistoryProps {
  expenses: Expense[];
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export function SpendHistory({ expenses, formatCurrency, formatDate }: SpendHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-green-600" />
          My Expenses
        </CardTitle>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No expenses recorded
          </div>
        ) : (
          <div className="divide-y">
            {expenses.map(expense => (
              <div key={expense.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{expense.category}</div>
                    <div className="text-sm text-muted-foreground">{expense.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">{formatDate(expense.date)}</div>
                  </div>
                  <div className="font-medium">{formatCurrency(expense.amount)}</div>
                </div>
              </div>
            ))}
            <div className="pt-4 flex justify-between items-center">
              <div className="font-semibold">Total</div>
              <div className="font-semibold">{
                formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))
              }</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
