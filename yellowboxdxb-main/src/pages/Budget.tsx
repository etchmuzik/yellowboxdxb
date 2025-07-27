import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/utils/dataUtils";

// Mock budget data
const mockBudgetData = {
  totalBudget: 500000,
  allocated: 425000,
  spent: 312500,
  remaining: 187500,
  categories: [
    {
      id: "1",
      name: "Fuel",
      budget: 150000,
      spent: 125000,
      percentage: 83.33
    },
    {
      id: "2",
      name: "Maintenance",
      budget: 80000,
      spent: 65000,
      percentage: 81.25
    },
    {
      id: "3",
      name: "Insurance",
      budget: 100000,
      spent: 75000,
      percentage: 75
    },
    {
      id: "4",
      name: "Salaries",
      budget: 95000,
      spent: 47500,
      percentage: 50
    }
  ],
  monthlyTrend: [
    { month: "Jan", budget: 450000, spent: 380000 },
    { month: "Feb", budget: 450000, spent: 420000 },
    { month: "Mar", budget: 500000, spent: 312500 }
  ]
};

export default function Budget() {
  const [selectedPeriod, setSelectedPeriod] = useState("current");

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return "bg-destructive";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-primary";
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Budget Management</h1>
            <p className="text-muted-foreground">Track and manage departmental budgets</p>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Allocate Budget
          </Button>
        </div>

        {/* Budget Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(mockBudgetData.totalBudget)}</div>
              <p className="text-xs text-muted-foreground">Monthly allocation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Allocated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(mockBudgetData.allocated)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                {((mockBudgetData.allocated / mockBudgetData.totalBudget) * 100).toFixed(0)}% of total
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(mockBudgetData.spent)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                {((mockBudgetData.spent / mockBudgetData.allocated) * 100).toFixed(0)}% of allocated
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(mockBudgetData.remaining)}</div>
              <p className="text-xs text-muted-foreground">Available to spend</p>
            </CardContent>
          </Card>
        </div>

        {/* Budget by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Budget by Category</CardTitle>
            <CardDescription>Current month allocation and spending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockBudgetData.categories.map((category) => (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{category.name}</span>
                      {category.percentage >= 90 && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          Over budget
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(category.spent)} / {formatCurrency(category.budget)}
                    </div>
                  </div>
                  <Progress 
                    value={category.percentage} 
                    className="h-2"
                    style={{
                      // @ts-expect-error CSS custom property not recognized by TypeScript
                      "--progress-background": getProgressColor(category.percentage)
                    }}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{category.percentage.toFixed(1)}% used</span>
                    <span>{formatCurrency(category.budget - category.spent)} remaining</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
            <CardDescription>Budget vs actual spending over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockBudgetData.monthlyTrend.map((month) => (
                <div key={month.month} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium">{month.month}</h3>
                    <p className="text-sm text-muted-foreground">
                      Budget: {formatCurrency(month.budget)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(month.spent)}</p>
                    <p className="text-sm text-muted-foreground">
                      {((month.spent / month.budget) * 100).toFixed(1)}% utilized
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}