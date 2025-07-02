import { SpendEvent } from '@/types';
import { formatCurrency } from '@/utils/dataUtils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ExpenseHistoryListProps {
  expenses: SpendEvent[];
}

export function ExpenseHistoryList({ expenses }: ExpenseHistoryListProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const sortedExpenses = [...expenses].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No expenses recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Receipt</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedExpenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>{format(new Date(expense.date), 'dd MMM yyyy')}</TableCell>
              <TableCell>
                <Badge variant="outline">{expense.category}</Badge>
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {expense.description}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(expense.amountAed)}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusColor(expense.status)}>
                  {expense.status || 'pending'}
                </Badge>
              </TableCell>
              <TableCell>
                {expense.receiptUrl ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(expense.receiptUrl, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}