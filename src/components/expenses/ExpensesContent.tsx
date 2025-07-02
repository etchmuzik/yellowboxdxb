
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAllExpenses } from "@/services/expenseService";
import { getAllRiders } from "@/services/riderService";
import { Skeleton } from "@/components/ui/skeleton";
import { SpendEvent, Rider } from "@/types";
import { formatCurrency } from "@/utils/dataUtils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RealExpenseForm } from "./RealExpenseForm";

export function ExpensesContent() {
  const [activeTab, setActiveTab] = useState("all");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const { isAdmin, isOperations, isFinance } = useAuth();
  
  const { data: expenses, isLoading: expensesLoading, refetch: refetchExpenses } = useQuery<SpendEvent[]>({
    queryKey: ["expenses"],
    queryFn: getAllExpenses
  });
  
  const { data: riders, isLoading: ridersLoading } = useQuery<Rider[]>({
    queryKey: ["riders"],
    queryFn: getAllRiders
  });

  const isLoading = expensesLoading || ridersLoading;

  const getRiderName = (riderId: string): string => {
    if (!riders) return "Unknown";
    const rider = riders.find(r => r.id === riderId);
    return rider ? rider.fullName : "Unknown";
  };
  
  const getExpensesByCategory = () => {
    if (!expenses) return [];
    
    const byCategory = expenses.reduce<Record<string, { total: number; count: number }>>(
      (acc, expense) => {
        if (!acc[expense.category]) {
          acc[expense.category] = { total: 0, count: 0 };
        }
        acc[expense.category].total += expense.amountAed;
        acc[expense.category].count += 1;
        return acc;
      },
      {}
    );
    
    return Object.entries(byCategory).map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Expenses</h1>
        {(isAdmin || isFinance) && (
          <Button onClick={() => setShowAddExpense(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        )}
      </div>
      
      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
          </DialogHeader>
          <RealExpenseForm 
            onSuccess={() => {
              setShowAddExpense(false);
              refetchExpenses();
            }}
          />
        </DialogContent>
      </Dialog>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Expenses</TabsTrigger>
          <TabsTrigger value="by-category">By Category</TabsTrigger>
          <TabsTrigger value="by-rider">By Rider</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : expenses && expenses.length > 0 ? (
                <div className="relative overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3">Date</th>
                        <th scope="col" className="px-6 py-3">Rider</th>
                        <th scope="col" className="px-6 py-3">Category</th>
                        <th scope="col" className="px-6 py-3">Description</th>
                        <th scope="col" className="px-6 py-3">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((expense) => (
                          <tr key={expense.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                            <td className="px-6 py-4">{new Date(expense.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4">{getRiderName(expense.riderId)}</td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {expense.category}
                              </span>
                            </td>
                            <td className="px-6 py-4">{expense.description}</td>
                            <td className="px-6 py-4 font-medium">{formatCurrency(expense.amountAed)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No expenses found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-category" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {getExpensesByCategory().map((item) => (
                    <Card key={item.category} className="overflow-hidden">
                      <CardHeader className="bg-muted/50">
                        <CardTitle className="text-lg">{item.category}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold mb-2">
                          {formatCurrency(item.total)}
                        </div>
                        <p className="text-muted-foreground">
                          {item.count} expense{item.count !== 1 ? 's' : ''}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="by-rider" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Rider</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[250px]" />
                        <Skeleton className="h-4 w-[200px]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : riders && riders.length > 0 ? (
                <div className="space-y-6">
                  {riders.map((rider) => {
                    const riderExpenses = expenses ? expenses.filter((e) => e.riderId === rider.id) : [];
                    const totalSpent = riderExpenses.reduce((sum, e) => sum + e.amountAed, 0);
                    
                    return (
                      <Card key={rider.id} className="border">
                        <CardHeader className="p-4 border-b bg-muted/50">
                          <CardTitle className="text-lg">{rider.fullName}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          {riderExpenses.length > 0 ? (
                            <>
                              <div className="p-4 border-b">
                                <div className="text-xl font-bold">{formatCurrency(totalSpent)}</div>
                                <p className="text-sm text-muted-foreground">
                                  Total expenses ({riderExpenses.length})
                                </p>
                              </div>
                              <div className="divide-y">
                                {riderExpenses
                                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                  .slice(0, 3) // Show only the 3 most recent expenses
                                  .map((expense) => (
                                    <div key={expense.id} className="p-4 flex justify-between items-center">
                                      <div>
                                        <p className="font-medium">{expense.category}</p>
                                        <p className="text-sm text-muted-foreground">
                                          {new Date(expense.date).toLocaleDateString()} - {expense.description}
                                        </p>
                                      </div>
                                      <span className="font-semibold">
                                        {formatCurrency(expense.amountAed)}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            </>
                          ) : (
                            <div className="p-4 text-center text-muted-foreground">
                              No expenses recorded
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No riders found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
