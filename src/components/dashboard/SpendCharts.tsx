
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/dataUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { getAllExpenses } from "@/services/expenseService";
import { SpendEvent } from "@/types";

const COLORS = ["#E52629", "#1A1F2C", "#4CAF50", "#FFC107", "#9C27B0", "#00BCD4", "#795548"];

export function SpendCharts() {
  const isMobile = useIsMobile();
  const [expenses, setExpenses] = useState<SpendEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const data = await getAllExpenses();
        setExpenses(data);
      } catch (error) {
        console.error("Error fetching expenses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  // Calculate spend by category from real data
  const getSpendByCategory = () => {
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    return categoryTotals;
  };

  // Calculate daily spend from real data
  const getDailySpend = () => {
    const dailyTotals: Record<string, number> = {};
    expenses.forEach(expense => {
      const date = new Date(expense.date).toISOString().split('T')[0];
      dailyTotals[date] = (dailyTotals[date] || 0) + expense.amount;
    });

    // Convert to array format for charts
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
            <CardTitle>Daily Spend vs Budget</CardTitle>
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
  
  // Prepare data for Pie Chart
  const categoryData = Object.entries(getSpendByCategory()).map(
    ([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length],
    })
  ).filter(item => item.value > 0);
  
  // Daily spend data
  const dailySpendData = getDailySpend();
  const currentMonthBudget = 50000; // May budget
  const dailyBudget = dailySpendData.length > 0 ? currentMonthBudget / dailySpendData.length : 0;
  
  // Add budget line to daily spend data
  const dailySpendWithBudget = dailySpendData.map(item => ({
    ...item,
    budget: dailyBudget,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
      {/* Spend by Category */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Spend by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={isMobile ? 80 : 100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => 
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {categoryData.map((entry, index) => (
              <div key={index} className="flex items-center text-sm">
                <div
                  className="w-3 h-3 rounded-full mr-1"
                  style={{ backgroundColor: entry.color }}
                />
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Spend vs Budget */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Daily Spend vs Budget</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dailySpendWithBudget}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => {
                    return new Date(date).getDate().toString();
                  }}
                />
                <YAxis 
                  tickFormatter={(value) => `${value.toLocaleString()}`} 
                />
                <Tooltip
                  labelFormatter={(date) => {
                    return new Date(date).toLocaleDateString('en-AE', {
                      month: 'short',
                      day: 'numeric'
                    });
                  }}
                  formatter={(value: number) => [formatCurrency(value), ""]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  name="Daily Spend"
                  stroke="#E52629"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="budget"
                  name="Daily Budget"
                  stroke="#1A1F2C"
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
