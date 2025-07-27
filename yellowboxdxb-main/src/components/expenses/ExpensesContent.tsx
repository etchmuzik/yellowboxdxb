
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { simpleRiderService, simpleExpenseService } from "@/services/simpleFirebaseService";
import { Skeleton } from "@/components/ui/skeleton";
import { SpendEvent, Rider } from "@/types";
import { formatCurrency } from "@/utils/dataUtils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SimpleExpenseForm } from "../SimpleExpenseForm";

export function ExpensesContent() {
  const [activeTab, setActiveTab] = useState("all");
  const [showAddExpense, setShowAddExpense] = useState(false);
  const { isAdmin, isOperations, isFinance } = useAuth();
  const queryClient = useQueryClient();
  
  const { data: expenses, isLoading: expensesLoading, refetch: refetchExpenses } = useQuery({
    queryKey: ["expenses"],
    queryFn: () => simpleExpenseService.getAll()
  });
  
  const { data: ridersData, isLoading: ridersLoading } = useQuery({
    queryKey: ["riders"],
    queryFn: () => simpleRiderService.getAll()
  });

  // Convert simple riders to expected format
  const riders: Rider[] = ridersData ? ridersData.map(rider => ({
    id: rider.id || '',
    fullName: rider.fullName,
    nationality: rider.nationality || 'UAE',
    phone: rider.phone,
    email: rider.email,
    bikeType: 'Standard',
    visaNumber: '',
    applicationStage: (rider.status as any) || 'Applied',
    testStatus: { theory: 'Pending' as const, road: 'Pending' as const, medical: 'Pending' as const },
    joinDate: rider.createdAt?.toISOString() || new Date().toISOString(),
    expectedStart: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    notes: '',
    assignedBikeId: null,
    documents: []
  })) : [];

  const isLoading = expensesLoading || ridersLoading;

  const getRiderName = (riderId: string): string => {
    if (!riders) return "Unknown";
    const rider = riders.find(r => r.id === riderId);
    return rider ? rider.fullName : "Unknown";
  };

  // Debug logging
  console.log('🐛 Debug - Raw expenses data:', expenses);
  console.log('🐛 Debug - Expenses loading:', expensesLoading);
  console.log('🐛 Debug - Riders loading:', ridersLoading);

  // Convert expenses to expected format
  const formattedExpenses = expenses ? expenses.map(expense => {
    console.log('🐛 Debug - Processing expense:', expense);
    return {
      id: expense.id,
      riderId: expense.riderId,
      category: expense.category,
      description: expense.description,
      amountAed: expense.amountAed || expense.amount || 0,
      date: expense.date || expense.createdAt || new Date(),
      status: expense.status || 'Pending'
    };
  }) : [];

  console.log('🐛 Debug - Formatted expenses:', formattedExpenses);
  
  const getExpensesByCategory = () => {
    if (!formattedExpenses) return [];
    
    const byCategory = formattedExpenses.reduce<Record<string, { total: number; count: number }>>(
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

      {/* Debug Information */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-sm">🐛 Debug Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <div>Expenses Loading: {expensesLoading ? 'Yes' : 'No'}</div>
          <div>Riders Loading: {ridersLoading ? 'Yes' : 'No'}</div>
          <div>Raw Expenses Count: {expenses ? expenses.length : 'null'}</div>
          <div>Formatted Expenses Count: {formattedExpenses ? formattedExpenses.length : 'null'}</div>
          <div>Riders Count: {riders ? riders.length : 'null'}</div>
          {expenses && expenses.length > 0 && (
            <div>Sample Expense: {JSON.stringify(expenses[0], null, 2)}</div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
          </DialogHeader>
          <SimpleExpenseForm 
            onSuccess={() => {
              console.log('💰 Expense form success - refreshing data...');
              setShowAddExpense(false);
              // Invalidate and refetch expenses
              queryClient.invalidateQueries({ queryKey: ["expenses"] });
              refetchExpenses();
              console.log('✅ Expense data refresh triggered');
            }}
            onCancel={() => setShowAddExpense(false)}
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
              ) : formattedExpenses && formattedExpenses.length > 0 ? (
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
                      {formattedExpenses
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
                    const riderExpenses = formattedExpenses ? formattedExpenses.filter((e) => e.riderId === rider.id) : [];
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
