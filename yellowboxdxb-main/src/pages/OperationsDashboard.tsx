import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Users, Bike, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useOperationsData } from '@/hooks/useOperationsData';
import { useOperationsMetrics } from '@/hooks/useOperationsMetrics';
import {
  MetricCard,
  RidersNeedingAttention,
  PipelineView,
  FleetView,
  ActivityView,
  QuickActions
} from '@/components/dashboard/operations';

export default function OperationsDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  const { riders, bikes, activities, loading } = useOperationsData();
  const metrics = useOperationsMetrics(riders, bikes);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Operations Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {currentUser?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/riders/new')}>
            <Users className="mr-2 h-4 w-4" />
            Add Rider
          </Button>
          <Button variant="outline" onClick={() => navigate('/bikes/new')}>
            <Bike className="mr-2 h-4 w-4" />
            Add Bike
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Riders"
          value={metrics.activeRiders}
          subtitle={`+${metrics.pendingRiders} in pipeline`}
          icon={Users}
          progress={(metrics.activeRiders / (metrics.activeRiders + metrics.pendingRiders)) * 100}
        />
        
        <MetricCard
          title="Fleet Status"
          value={`${metrics.assignedBikes}/${bikes.length}`}
          subtitle={`${metrics.availableBikes} available`}
          icon={Bike}
          badges={[
            { label: 'Active', value: metrics.assignedBikes, variant: 'default' },
            { label: 'Ready', value: metrics.availableBikes, variant: 'secondary' },
            ...(metrics.maintenanceBikes > 0 
              ? [{ label: 'Service', value: metrics.maintenanceBikes, variant: 'destructive' as const }] 
              : [])
          ]}
        />
        
        <MetricCard
          title="Avg Onboarding"
          value={`${metrics.avgOnboardingTime.toFixed(0)} days`}
          subtitle="Target: 21 days"
          icon={Clock}
          progress={Math.min((21 / metrics.avgOnboardingTime) * 100, 100)}
        />
        
        <MetricCard
          title="Test Pass Rate"
          value={`${metrics.testPassRate.toFixed(0)}%`}
          subtitle="All test types combined"
          icon={TrendingUp}
          progress={metrics.testPassRate}
        />
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="fleet">Fleet Management</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <RidersNeedingAttention riders={metrics.ridersNeedingAttention} />
          <QuickActions totalRiders={riders.length} assignedBikes={metrics.assignedBikes} />
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <PipelineView ridersByStage={metrics.ridersByStage} totalRiders={riders.length} />
        </TabsContent>

        <TabsContent value="fleet" className="space-y-4">
          <FleetView 
            bikes={bikes}
            assignedBikes={metrics.assignedBikes}
            availableBikes={metrics.availableBikes}
            maintenanceBikes={metrics.maintenanceBikes}
          />
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <ActivityView activities={activities} />
        </TabsContent>
      </Tabs>
    </div>
  );
}