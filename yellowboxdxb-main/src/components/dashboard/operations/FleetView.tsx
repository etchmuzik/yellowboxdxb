import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Bike } from '@/types';

interface FleetViewProps {
  bikes: Bike[];
  assignedBikes: number;
  availableBikes: number;
  maintenanceBikes: number;
}

export const FleetView = React.memo(function FleetView({ 
  bikes, 
  assignedBikes, 
  availableBikes, 
  maintenanceBikes 
}: FleetViewProps) {
  const maintenanceDueBikes = bikes
    .filter(b => b.lastMaintenanceDate)
    .sort((a, b) => 
      new Date(a.lastMaintenanceDate!).getTime() - 
      new Date(b.lastMaintenanceDate!).getTime()
    )
    .slice(0, 3);

  return (
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
            {maintenanceDueBikes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No maintenance scheduled
              </p>
            ) : (
              maintenanceDueBikes.map(bike => (
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
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});