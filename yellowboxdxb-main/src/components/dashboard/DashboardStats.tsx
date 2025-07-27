import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, Users, CheckCircle, TrendingUp, DollarSign } from "lucide-react";
import { formatCurrency } from "@/utils/dataUtils";
import { cn } from "@/lib/utils";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/config/firebase";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

export function StatCard({ label, value, trend, icon, loading, className }: StatCardProps) {
  return (
    <div className={cn("stat-card", className)}>
      <div className="flex items-center justify-between mb-2">
        <div className="stat-label">{label}</div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="stat-value">
        {loading ? (
          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
        ) : (
          value
        )}
      </div>
      {trend && !loading && (
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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    newApplicants: { value: 0, change: 0 },
    testsPassed: { value: 0, change: 0 },
    activeRiders: { value: 0, change: 0 },
    monthlyExpenses: { value: 0, change: 0 }
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Get date ranges
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch riders data
      const ridersSnapshot = await getDocs(collection(db, 'riders'));
      const riders = ridersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Calculate metrics
      const activeRiders = riders.filter(r => r.status === 'active').length;
      const activeRidersLastMonth = riders.filter(r => 
        r.status === 'active' && 
        r.activatedAt?.toDate() <= endOfLastMonth
      ).length;
      
      // New applicants this month
      const newApplicantsQuery = query(
        collection(db, 'riders'),
        where('applicationDate', '>=', Timestamp.fromDate(startOfMonth))
      );
      const newApplicantsSnapshot = await getDocs(newApplicantsQuery);
      const newApplicants = newApplicantsSnapshot.size;
      
      // New applicants last month
      const lastMonthApplicantsQuery = query(
        collection(db, 'riders'),
        where('applicationDate', '>=', Timestamp.fromDate(startOfLastMonth)),
        where('applicationDate', '<', Timestamp.fromDate(startOfMonth))
      );
      const lastMonthApplicantsSnapshot = await getDocs(lastMonthApplicantsQuery);
      const lastMonthApplicants = lastMonthApplicantsSnapshot.size;
      
      // Tests passed (riders who completed training)
      const testsPassedThisMonth = riders.filter(r => 
        r.trainingCompleted && 
        r.trainingCompletedAt?.toDate() >= startOfMonth
      ).length;
      
      const testsPassedLastMonth = riders.filter(r => 
        r.trainingCompleted && 
        r.trainingCompletedAt?.toDate() >= startOfLastMonth &&
        r.trainingCompletedAt?.toDate() < startOfMonth
      ).length;
      
      // Monthly expenses
      const expensesQuery = query(
        collection(db, 'expenses'),
        where('submittedAt', '>=', Timestamp.fromDate(startOfMonth)),
        where('status', '==', 'approved')
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      const monthlyExpenses = expensesSnapshot.docs.reduce((sum, doc) => 
        sum + (doc.data().amount || 0), 0
      );
      
      // Last month expenses
      const lastMonthExpensesQuery = query(
        collection(db, 'expenses'),
        where('submittedAt', '>=', Timestamp.fromDate(startOfLastMonth)),
        where('submittedAt', '<', Timestamp.fromDate(startOfMonth)),
        where('status', '==', 'approved')
      );
      const lastMonthExpensesSnapshot = await getDocs(lastMonthExpensesQuery);
      const lastMonthExpenses = lastMonthExpensesSnapshot.docs.reduce((sum, doc) => 
        sum + (doc.data().amount || 0), 0
      );
      
      // Calculate percentage changes
      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      setStats({
        newApplicants: {
          value: newApplicants,
          change: calculateChange(newApplicants, lastMonthApplicants)
        },
        testsPassed: {
          value: testsPassedThisMonth,
          change: calculateChange(testsPassedThisMonth, testsPassedLastMonth)
        },
        activeRiders: {
          value: activeRiders,
          change: calculateChange(activeRiders, activeRidersLastMonth)
        },
        monthlyExpenses: {
          value: monthlyExpenses,
          change: calculateChange(monthlyExpenses, lastMonthExpenses)
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="New Applicants"
        value={stats.newApplicants.value}
        trend={{ 
          value: Math.abs(stats.newApplicants.change), 
          isPositive: stats.newApplicants.change >= 0 
        }}
        icon={<Users className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        label="Tests Passed"
        value={stats.testsPassed.value}
        trend={{ 
          value: Math.abs(stats.testsPassed.change), 
          isPositive: stats.testsPassed.change >= 0 
        }}
        icon={<CheckCircle className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        label="Active Riders"
        value={stats.activeRiders.value}
        trend={{ 
          value: Math.abs(stats.activeRiders.change), 
          isPositive: stats.activeRiders.change >= 0 
        }}
        icon={<TrendingUp className="h-4 w-4" />}
        loading={loading}
      />
      <StatCard
        label="Month-to-Date Spend"
        value={formatCurrency(stats.monthlyExpenses.value)}
        trend={{ 
          value: Math.abs(stats.monthlyExpenses.change), 
          isPositive: stats.monthlyExpenses.change <= 0 // Lower expenses is positive
        }}
        icon={<DollarSign className="h-4 w-4" />}
        loading={loading}
      />
    </div>
  );
}