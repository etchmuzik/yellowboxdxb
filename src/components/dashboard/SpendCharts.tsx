import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/dataUtils";
import { useState, useEffect } from "react";
import { getAllExpenses } from "@/services/expenseService";
import { SpendEvent } from "@/types";

export function SpendCharts() {
  const [expenses, setExpenses] = useState<SpendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const data = await getAllExpenses();
        setExpenses(data || []);
      } catch (error) {
        console.error("Error fetching expenses:", error);
        setError("Failed to load expense data");
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  // Calculate spend by category from real data
  const getSpendByCategory = () => {
    const categoryTotals: Record<string, number> = {};
    if (expenses && expenses.length > 0) {
      expenses.forEach(expense => {
        if (expense && expense.category && expense.amountAed) {
          categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amountAed;
        }
      });
    }
    return categoryTotals;
  };

  // Calculate daily spend from real data
  const getDailySpend = () => {
    const dailyTotals: Record<string, number> = {};
    if (expenses && expenses.length > 0) {
      expenses.forEach(expense => {
        if (expense && expense.date && expense.amountAed) {
          try {
            const date = new Date(expense.date).toISOString().split('T')[0];
            dailyTotals[date] = (dailyTotals[date] || 0) + expense.amountAed;
          } catch (e) {
            console.error("Invalid date:", expense.date);
          }
        }
      });
    }

    // Convert to array format for display
    return Object.entries(dailyTotals).map(([date, amount]) => ({
      date,
      amount
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Loading chart data...</p>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Spend Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">Loading chart data...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-3">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryData = getSpendByCategory();
  const dailySpendData = getDailySpend();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
      {/* Spend by Category - Simple Table View */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Spend by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(categoryData).length > 0 ? (
              Object.entries(categoryData)
                .sort((a, b) => b[1] - a[1])
                .map(([category, amount]) => {
                  const total = Object.values(categoryData).reduce((sum, val) => sum + val, 0);
                  const percentage = total > 0 ? (amount / total) * 100 : 0;
                  
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{category}</span>
                        <span className="text-muted-foreground">{formatCurrency(amount)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="text-center text-muted-foreground">No expense data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily Spend Trend - Simple Table View */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Daily Spend Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dailySpendData.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Spend</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(dailySpendData.reduce((sum, day) => sum + day.amount, 0))}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Daily Average</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        dailySpendData.length > 0 
                          ? dailySpendData.reduce((sum, day) => sum + day.amount, 0) / dailySpendData.length
                          : 0
                      )}
                    </p>
                  </div>
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Date</th>
                        <th className="text-right py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailySpendData.slice(-10).reverse().map((day) => (
                        <tr key={day.date} className="border-b">
                          <td className="py-2">
                            {new Date(day.date).toLocaleDateString('en-AE', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="text-right py-2 font-medium">
                            {formatCurrency(day.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground">No expense data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}