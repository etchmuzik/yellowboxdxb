import { useState } from 'react';
import { SpendEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/dataUtils';
import { format } from 'date-fns';
import { Check, X, Eye } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approveExpense, rejectExpense } from '@/services/expenseService';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface ExpenseApprovalListProps {
  expenses: SpendEvent[];
}

export function ExpenseApprovalList({ expenses }: ExpenseApprovalListProps) {
  const [selectedExpense, setSelectedExpense] = useState<SpendEvent | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: (expenseId: string) => approveExpense(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: 'Expense Approved',
        description: 'The expense has been approved successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to approve expense. Please try again.',
        variant: 'destructive',
      });
      console.error('Approve error:', error);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ expenseId, reason }: { expenseId: string; reason: string }) => 
      rejectExpense(expenseId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({
        title: 'Expense Rejected',
        description: 'The expense has been rejected.',
      });
      setShowRejectDialog(false);
      setRejectReason('');
      setSelectedExpense(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to reject expense. Please try again.',
        variant: 'destructive',
      });
      console.error('Reject error:', error);
    },
  });

  const handleApprove = (expense: SpendEvent) => {
    approveMutation.mutate(expense.id);
  };

  const handleReject = (expense: SpendEvent) => {
    setSelectedExpense(expense);
    setShowRejectDialog(true);
  };

  const confirmReject = () => {
    if (selectedExpense && rejectReason.trim()) {
      rejectMutation.mutate({ 
        expenseId: selectedExpense.id, 
        reason: rejectReason 
      });
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No pending expenses to approve.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Rider</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Receipt</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{format(new Date(expense.date), 'dd MMM yyyy')}</TableCell>
                <TableCell>{expense.riderName || 'Unknown'}</TableCell>
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
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleApprove(expense)}
                      disabled={approveMutation.isPending}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleReject(expense)}
                      disabled={rejectMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Expense</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this expense. This will be shared with the rider.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason('');
                setSelectedExpense(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectReason.trim() || rejectMutation.isPending}
            >
              Reject Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}