import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Bike, 
  Activity, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  MapPin,
  Calendar,
  FileText,
  TrendingUp,
  Package
} from 'lucide-react';
import { getAllRiders } from '@/services/riderService';
import { getAllBikes } from '@/services/bikeService';
import { getRecentActivities } from '@/services/activityService';
import { Rider, Bike as BikeType, ApplicationStage } from '@/types';
import { StageBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/hooks/use-auth';
import { formatDistanceToNow } from 'date-fns';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  userId?: string;
  riderId?: string;
}

export default function OperationsDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [bikes, setBikes] = useState<BikeType[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Real-time listeners
  useEffect(() => {
    const unsubscribeRiders = onSnapshot(
      collection(db, 'riders'),
      (snapshot) => {
        const ridersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Rider[];
        setRiders(ridersData);
      }
    );

    const unsubscribeBikes = onSnapshot(
      collection(db, 'bikes'),
      (snapshot) => {
        const bikesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BikeType[];
        setBikes(bikesData);
      }
    );

    const unsubscribeActivities = onSnapshot(
      query(
        collection(db, 'activities'),
        orderBy('timestamp', 'desc'),
        limit(20)
      ),
      (snapshot) => {
        const activitiesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Activity[];
        setActivities(activitiesData);
      }
    );

    setLoading(false);

    // Cleanup
    return () => {
      unsubscribeRiders();
      unsubscribeBikes();
      unsubscribeActivities();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate metrics
  const activeRiders = riders.filter(r => r.applicationStage === 'Active').length;
  const pendingRiders = riders.filter(r => 
    r.applicationStage !== 'Active' && r.applicationStage !== 'ID Issued'
  ).length;
  const ridersInTraining = riders.filter(r => 
    r.applicationStage === 'Theory Test' || r.applicationStage === 'Road Test'
  ).length;

  const availableBikes = bikes.filter(b => b.status === 'Available').length;
  const assignedBikes = bikes.filter(b => b.status === 'Assigned').length;
  const maintenanceBikes = bikes.filter(b => b.status === 'Maintenance').length;

  // Get riders by stage
  const ridersByStage = riders.reduce((acc, rider) => {
    acc[rider.applicationStage] = (acc[rider.applicationStage] || 0) + 1;
    return acc;
  }, {} as Record<ApplicationStage, number>);

  // Get riders needing attention
  const ridersNeedingAttention = riders.filter(r => {
    // Test failures
    if (r.testStatus.theory === 'Fail' || r.testStatus.road === 'Fail') return true;
    
    // Stuck in a stage for too long (more than 7 days)
    const daysSinceJoin = Math.floor(
      (new Date().getTime() - new Date(r.joinDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (r.applicationStage === 'Applied' && daysSinceJoin > 7) return true;
    if (r.applicationStage === 'Docs Verified' && daysSinceJoin > 14) return true;
    
    return false;
  }).slice(0, 5);

  // Performance metrics
  const avgOnboardingTime = riders
    .filter(r => r.applicationStage === 'Active')
    .reduce((acc, rider) => {
      const days = Math.floor(
        (new Date(rider.expectedStart).getTime() - new Date(rider.joinDate).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      return acc + days;
    }, 0) / (activeRiders || 1);

  const testPassRate = riders.reduce((acc, rider) => {
    const tests = [rider.testStatus.theory, rider.testStatus.road, rider.testStatus.medical];
    const passedTests = tests.filter(t => t === 'Pass').length;
    return acc + (passedTests / 3);
  }, 0) / (riders.length || 1) * 100;

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Riders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRiders}</div>
            <p className="text-xs text-muted-foreground">
              +{pendingRiders} in pipeline
            </p>
            <Progress 
              value={(activeRiders / (activeRiders + pendingRiders)) * 100} 
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Status</CardTitle>
            <Bike className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignedBikes}/{bikes.length}</div>
            <p className="text-xs text-muted-foreground">
              {availableBikes} available
            </p>
            <div className="flex gap-1 mt-2">
              <Badge variant="default" className="text-xs">
                {assignedBikes} Active
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {availableBikes} Ready
              </Badge>
              {maintenanceBikes > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {maintenanceBikes} Service
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Onboarding</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgOnboardingTime.toFixed(0)} days</div>
            <p className="text-xs text-muted-foreground">
              Target: 21 days
            </p>
            <Progress 
              value={Math.min((21 / avgOnboardingTime) * 100, 100)} 
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Pass Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testPassRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              All test types combined
            </p>
            <Progress 
              value={testPassRate} 
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>
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
          {/* Riders Needing Attention */}
          <Card>
            <CardHeader>
              <CardTitle>Riders Needing Attention</CardTitle>
            </CardHeader>
            <CardContent>
              {ridersNeedingAttention.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  All riders are progressing normally
                </p>
              ) : (
                <div className="space-y-4">
                  {ridersNeedingAttention.map((rider) => (
                    <div 
                      key={rider.id} 
                      className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-lg transition-colors"
                      onClick={() => navigate(`/riders/${rider.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{rider.fullName}</p>
                          <p className="text-sm text-muted-foreground">
                            {rider.applicationStage} • {rider.nationality}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {(rider.testStatus.theory === 'Fail' || rider.testStatus.road === 'Fail') && (
                          <Badge variant="destructive" className="mb-1">
                            Test Failed
                          </Badge>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(rider.joinDate), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow" 
              onClick={() => navigate('/riders')}
            >
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-medium">Manage Riders</p>
                  <p className="text-xs text-muted-foreground">
                    View all {riders.length} riders
                  </p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow" 
              onClick={() => navigate('/bike-tracker')}
            >
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-medium">Track Fleet</p>
                  <p className="text-xs text-muted-foreground">
                    {assignedBikes} bikes active
                  </p>
                </div>
                <MapPin className="h-8 w-8 text-primary" />
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:shadow-lg transition-shadow" 
              onClick={() => navigate('/reports')}
            >
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <p className="text-sm font-medium">View Reports</p>
                  <p className="text-xs text-muted-foreground">
                    Analytics & insights
                  </p>
                </div>
                <FileText className="h-8 w-8 text-primary" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Application Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(['Applied', 'Docs Verified', 'Theory Test', 'Road Test', 'Medical', 'ID Issued'] as ApplicationStage[])
                  .map((stage) => {
                    const count = ridersByStage[stage] || 0;
                    const percentage = riders.length > 0 ? (count / riders.length) * 100 : 0;
                    
                    return (
                      <div key={stage} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <StageBadge stage={stage} />
                            <span className="text-sm font-medium">
                              {count} riders
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/riders?stage=${stage}`)}
                          >
                            View
                          </Button>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fleet" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Fleet Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Bikes</span>
                    <span className="font-bold">{bikes.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Assigned</span>
                    <Badge variant="default">{assignedBikes}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Available</span>
                    <Badge variant="secondary">{availableBikes}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Maintenance</span>
                    <Badge variant="destructive">{maintenanceBikes}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bikes
                    .filter(b => b.lastMaintenanceDate)
                    .sort((a, b) => 
                      new Date(a.lastMaintenanceDate!).getTime() - 
                      new Date(b.lastMaintenanceDate!).getTime()
                    )
                    .slice(0, 3)
                    .map(bike => (
                      <div key={bike.id} className="flex justify-between items-center">
                        <div>
                          <p className="text-sm font-medium">{bike.model}</p>
                          <p className="text-xs text-muted-foreground">
                            {bike.registrationNumber}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Due {formatDistanceToNow(
                            new Date(bike.lastMaintenanceDate!), 
                            { addSuffix: true }
                          )}
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No recent activity
                  </p>
                ) : (
                  activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                        <Activity className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}