
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationStage, Bike } from "@/types";
import { useEffect, useState } from "react";
import { getBikeByRiderId } from "@/services/bikeService";

interface RiderInfoCardProps {
  nationality: string;
  bikeType: string;
  visaNumber: string;
  joinDate: string;
  expectedStart: string;
  notes: string;
  applicationStage: ApplicationStage;
  currentStageIndex: number;
  riderId: string;
}

export function RiderInfoCard({
  nationality,
  bikeType,
  visaNumber,
  joinDate,
  expectedStart,
  notes,
  applicationStage,
  currentStageIndex,
  riderId
}: RiderInfoCardProps) {
  const [assignedBike, setAssignedBike] = useState<Bike | null>(null);
  const [loadingBike, setLoadingBike] = useState(true);

  // Define application stages for the timeline
  const stages = [
    "Applied",
    "Docs Verified",
    "Theory Test",
    "Road Test",
    "Medical",
    "ID Issued",
    "Active",
  ];

  useEffect(() => {
    const fetchAssignedBike = async () => {
      try {
        setLoadingBike(true);
        const bike = await getBikeByRiderId(riderId);
        setAssignedBike(bike);
      } catch (error) {
        console.error("Error fetching assigned bike:", error);
      } finally {
        setLoadingBike(false);
      }
    };

    if (riderId) {
      fetchAssignedBike();
    }
  }, [riderId]);

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Rider Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Nationality</div>
                <div>{nationality}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Bike Type</div>
                <div>{bikeType}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Visa Number</div>
                <div>{visaNumber}</div>
              </div>
            </div>
          </div>
          <div>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Join Date</div>
                <div>{new Date(joinDate).toLocaleDateString('en-AE')}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Expected Start</div>
                <div>{new Date(expectedStart).toLocaleDateString('en-AE')}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Notes</div>
                <div className="text-sm">{notes}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Bike Information */}
        {applicationStage === 'Active' && (
          <div className="mt-4 border-t pt-4">
            <div className="text-sm font-medium mb-2">Assigned Bike</div>
            {assignedBike ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/20 p-3 rounded-md">
                <div>
                  <div className="text-xs text-muted-foreground">Model</div>
                  <div>{assignedBike.model}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Registration</div>
                  <div>{assignedBike.registrationNumber}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">GPS Tracker ID</div>
                  <div>{assignedBike.gpsTrackerId}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Last Maintenance</div>
                  <div>{assignedBike.lastMaintenanceDate ? new Date(assignedBike.lastMaintenanceDate).toLocaleDateString('en-AE') : 'Not available'}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No bike currently assigned</div>
            )}
          </div>
        )}

        <div className="mt-6">
          <div className="mb-2 font-medium">Application Progress</div>
          <div className="relative">
            <div className="absolute left-0 top-4 h-0.5 w-full bg-muted">
              <div 
                className="h-0.5 bg-nike-red" 
                style={{ 
                  width: `${Math.min(100, (currentStageIndex / (stages.length - 1)) * 100)}%` 
                }}
              ></div>
            </div>
            <div className="relative flex justify-between">
              {stages.map((stage, index) => (
                <div 
                  key={stage} 
                  className="flex flex-col items-center"
                >
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                      index <= currentStageIndex 
                        ? 'bg-nike-red text-white' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="text-xs mt-2 w-16 text-center">
                    {stage}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
