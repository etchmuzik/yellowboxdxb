import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/utils/dataUtils";
import { useState, useEffect, memo } from "react";
import { getAllExpenses } from "@/services/expenseService";
import { SpendEvent } from "@/types";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { ValueType, NameType } from "recharts/types/component/DefaultTooltipContent";

// Type definitions for Recharts components
interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  active?: boolean;
  payload?: Array<{
    value: number;
    name?: string;
    dataKey?: string;
    payload?: Record<string, unknown>;
  }>;
  label?: string;
}

interface PieLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index?: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"];

export const SpendCharts = memo(function SpendCharts() {
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
    
    // Convert to array format for Recharts
    return Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
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

    // Convert to array format and get last 30 days
    const sortedData = Object.entries(dailyTotals)
      .map(([date, amount]) => ({
        date,
        amount,
        displayDate: new Date(date).toLocaleDateString('en-AE', { 
          month: 'short', 
          day: 'numeric' 
        })
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);

    return sortedData;
  };

  // Custom tooltip for currency formatting
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          <p className="text-sm text-primary">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderCustomizedLabel = ({
    cx, cy, midAngle, innerRadius, outerRadius, percent
  }: PieLabelProps) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
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
              <div className="animate-pulse">
                <div className="h-48 w-48 bg-muted rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Daily Spend Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-pulse w-full">
                <div className="h-64 bg-muted rounded"></div>
              </div>
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
  const totalSpend = dailySpendData.reduce((sum, day) => sum + day.amount, 0);
  const avgDailySpend = dailySpendData.length > 0 ? totalSpend / dailySpendData.length : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
      {/* Spend by Category - Pie Chart */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Spend by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value, entry) => `${value}: ${formatCurrency(entry.value)}`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">No expense data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Spend Trend - Line Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Daily Spend Trend</CardTitle>
          <div className="flex gap-4 mt-2">
            <div>
              <p className="text-sm text-muted-foreground">Total (30d)</p>
              <p className="text-xl font-bold">{formatCurrency(totalSpend)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Daily Average</p>
              <p className="text-xl font-bold">{formatCurrency(avgDailySpend)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {dailySpendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailySpendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="displayDate" 
                  className="text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  className="text-xs"
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  dot={{ fill: '#8884d8', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">No expense data available</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});