import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Bike, Activity, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { getAllRiders } from "@/services/riderService";
import { getAllBikes } from "@/services/bikeService";
import { Rider, Bike as BikeType, ApplicationStage } from "@/types";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { StageBadge } from "@/components/ui/StatusBadge";

export function OperationsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [bikes, setBikes] = useState<BikeType[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ridersData, bikesData] = await Promise.all([
          getAllRiders(),
          getAllBikes()
        ]);
        setRiders(ridersData);
        setBikes(bikesData);
      } catch (error) {
        console.error("Error fetching operations data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-t-nike-red rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate rider statistics
  const activeRiders = riders.filter(r => r.applicationStage === 'Active').length;
  const pendingRiders = riders.filter(r => 
    r.applicationStage !== 'Active' && r.applicationStage !== 'ID Issued'
  ).length;
  const ridersInTraining = riders.filter(r => 
    r.applicationStage === 'Theory Test' || r.applicationStage === 'Road Test'
  ).length;

  // Calculate bike statistics
  const availableBikes = bikes.filter(b => b.status === 'available').length;
  const inUseBikes = bikes.filter(b => b.status === 'in-use').length;
  const maintenanceBikes = bikes.filter(b => b.status === 'maintenance').length;

  // Get riders by stage for pipeline view
  const ridersByStage = riders.reduce((acc, rider) => {
    acc[rider.applicationStage] = (acc[rider.applicationStage] || 0) + 1;
    return acc;
  }, {} as Record<ApplicationStage, number>);

  // Get recent riders needing attention
  const ridersNeedingAttention = riders.filter(r => {
    // Logic to determine riders needing immediate attention
    return r.applicationStage === 'Docs Verified' || 
           (r.testStatus.theory === 'Fail' || r.testStatus.road === 'Fail');
  }).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Operations Dashboard</h1>
        <p className="text-muted-foreground">
          Rider management and fleet operations
        </p>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Status</CardTitle>
            <Bike className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inUseBikes}/{bikes.length}</div>
            <p className="text-xs text-muted-foreground">
              {availableBikes} available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Training</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ridersInTraining}</div>
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs"
              onClick={() => navigate('/riders')}
            >
              View all riders →
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceBikes}</div>
            <p className="text-xs text-muted-foreground">
              bikes in service
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Application Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Application Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(['Applied', 'Docs Verified', 'Theory Test', 'Road Test', 'Medical', 'ID Issued'] as ApplicationStage[])
              .map((stage) => {
                const count = ridersByStage[stage] || 0;
                const percentage = riders.length > 0 ? (count / riders.length) * 100 : 0;
                
                return (
                  <div key={stage} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StageBadge stage={stage} />
                        <span className="text-sm text-muted-foreground">
                          {count} riders
                        </span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Riders Needing Attention */}
      <Card>
        <CardHeader>
          <CardTitle>Riders Needing Attention</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ridersNeedingAttention.map((rider) => (
              <div 
                key={rider.id} 
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded"
                onClick={() => navigate(`/riders/${rider.id}`)}
              >
                <div>
                  <p className="text-sm font-medium">{rider.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {rider.applicationStage} • {rider.nationality}
                  </p>
                </div>
                <div className="text-right">
                  {(rider.testStatus.theory === 'Fail' || rider.testStatus.road === 'Fail') && (
                    <p className="text-xs text-red-600 font-medium">Test Failed</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Applied {new Date(rider.joinDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/riders')}>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium">Manage Riders</p>
              <p className="text-xs text-muted-foreground">View and update rider information</p>
            </div>
            <Users className="h-8 w-8 text-yellowbox-yellow" />
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/bike-tracker')}>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium">Track Fleet</p>
              <p className="text-xs text-muted-foreground">Real-time bike locations</p>
            </div>
            <Activity className="h-8 w-8 text-yellowbox-yellow" />
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/activity')}>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium">Activity Log</p>
              <p className="text-xs text-muted-foreground">Recent system activities</p>
            </div>
            <CheckCircle className="h-8 w-8 text-yellowbox-yellow" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}