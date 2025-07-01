
import { ArrowUp, ArrowDown } from "lucide-react";
import { formatCurrency } from "@/data";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatCard({ label, value, trend, className }: StatCardProps) {
  return (
    <div className={cn("stat-card", className)}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {trend && (
        <div
          className={cn(
            "stat-change",
            trend.isPositive ? "text-green-600" : "text-red-600"
          )}
        >
          {trend.isPositive ? (
            <ArrowUp className="h-3 w-3 mr-1" />
          ) : (
            <ArrowDown className="h-3 w-3 mr-1" />
          )}
          <span>{trend.value}%</span>
          <span className="ml-1 text-muted-foreground">vs. last month</span>
        </div>
      )}
    </div>
  );
}

export function DashboardStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total Applicants"
        value="5"
        trend={{ value: 25, isPositive: true }}
      />
      <StatCard
        label="Tests Passed"
        value="8"
        trend={{ value: 10, isPositive: true }}
      />
      <StatCard
        label="Average Spend / Rider"
        value={formatCurrency(5230)}
        trend={{ value: 5, isPositive: true }}
      />
      <StatCard
        label="Month-to-Date Spend"
        value={formatCurrency(22250)}
        trend={{ value: 15, isPositive: false }}
      />
    </div>
  );
}
