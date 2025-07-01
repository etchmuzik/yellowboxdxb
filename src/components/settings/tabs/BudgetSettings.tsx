
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// Format currency in AED
const formatCurrency = (amount: number) => {
  return `AED ${amount.toLocaleString('en-AE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
import { toast } from "@/components/ui/use-toast";

// Budget settings storage keys
const MONTHLY_BUDGET_KEY = "nike-rider-monthly-budget";
const ALERT_THRESHOLD_KEY = "nike-rider-alert-threshold";

export function BudgetSettings() {
  const [monthlyBudget, setMonthlyBudget] = useState(30000);
  const [alertThreshold, setAlertThreshold] = useState(80);

  // Load saved budget settings on mount
  useEffect(() => {
    const savedMonthlyBudget = localStorage.getItem(MONTHLY_BUDGET_KEY);
    const savedAlertThreshold = localStorage.getItem(ALERT_THRESHOLD_KEY);
    
    if (savedMonthlyBudget) {
      setMonthlyBudget(Number(savedMonthlyBudget));
    }
    
    if (savedAlertThreshold) {
      setAlertThreshold(Number(savedAlertThreshold));
    }
  }, []);

  const saveBudgetSettings = () => {
    localStorage.setItem(MONTHLY_BUDGET_KEY, monthlyBudget.toString());
    localStorage.setItem(ALERT_THRESHOLD_KEY, alertThreshold.toString());
    
    toast({
      title: "Budget Settings Saved",
      description: `Monthly budget set to ${formatCurrency(monthlyBudget)} with ${alertThreshold}% alert threshold.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Configuration</CardTitle>
        <CardDescription>
          Set monthly budget allocations and alert thresholds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="monthly-budget">Monthly Budget (AED)</Label>
          <Input
            id="monthly-budget"
            type="number"
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(Number(e.target.value))}
          />
          <p className="text-sm text-muted-foreground">
            Current budget: {formatCurrency(monthlyBudget)}
          </p>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="alert-threshold">Alert Threshold</Label>
            <span>{alertThreshold}%</span>
          </div>
          <Slider
            id="alert-threshold"
            min={50}
            max={100}
            step={5}
            value={[alertThreshold]}
            onValueChange={(value) => setAlertThreshold(value[0])}
          />
          <p className="text-sm text-muted-foreground">
            You'll be alerted when spending reaches {alertThreshold}% of the monthly budget 
            ({formatCurrency(monthlyBudget * alertThreshold / 100)})
          </p>
        </div>
        
        <Button 
          className="w-full sm:w-auto"
          onClick={saveBudgetSettings}
        >
          Save Budget Settings
        </Button>
      </CardContent>
    </Card>
  );
}
