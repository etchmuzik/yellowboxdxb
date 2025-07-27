
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Map, MapPin, Navigation } from "lucide-react";
import { Bike } from "@/types";
import { RiderLocation } from "@/components/bike-tracker/types";
import { BikeMap } from "@/components/bike-tracker/BikeMap";
import { getBikeByRiderId } from "@/services/bikeService";

export function MyBikeLocationCard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [assignedBike, setAssignedBike] = useState<Bike | null>(null);
  const [bikeLocation, setBikeLocation] = useState<RiderLocation | null>(null);

  useEffect(() => {
    const loadBikeData = async () => {
      if (!currentUser?.id) return;
      
      setIsLoading(true);
      try {
        // In a real app, fetch the bike data from Firebase
        // For now, we'll use mock data
        const bike = await getBikeByRiderId(currentUser.id);
        
        setAssignedBike(bike);
        
        // Mock rider location data
        if (bike) {
          const mockLocation: RiderLocation = {
            riderId: currentUser.id,
            riderName: currentUser.name || "You",
            latitude: 25.197197, // Dubai coordinates
            longitude: 55.274376,
            speed: 0,
            timestamp: Date.now(),
            heading: 90,
            bikeType: bike.model,
            district: "Downtown Dubai",
            status: "Active",
            lastUpdated: new Date().toISOString(),
            photo: undefined,
            bikeId: bike.id,
            bikeModel: bike.model,
            bikeRegistration: bike.registrationNumber,
            gpsTrackerId: bike.gpsTrackerId
          };
          
          setBikeLocation(mockLocation);
        }
      } catch (error) {
        console.error("Error loading bike data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadBikeData();
  }, [currentUser?.id, currentUser?.name]);
  
  const handleViewFullTracker = () => {
    navigate("/bike-tracker");
  };
  
  if (isLoading) {
    return (
      <Card className="shadow-md border-t-2 border-t-yellowbox-yellow h-[300px]">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-yellowbox-yellow" />
            My Bike Location
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[220px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellowbox-yellow"></div>
        </CardContent>
      </Card>
    );
  }

  if (!assignedBike) {
    return (
      <Card className="shadow-md border-t-2 border-t-yellowbox-yellow h-[300px]">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-yellowbox-yellow" />
            My Bike Location
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[220px] p-6 text-center">
          <Map className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-500">You don't have a bike assigned yet.</p>
          <p className="text-sm text-gray-400">Once you get a bike, you'll be able to track it here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-md border-t-2 border-t-yellowbox-yellow">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-yellowbox-yellow" />
          My Bike Location
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[200px] w-full">
          {bikeLocation && (
            <BikeMap 
              riders={[bikeLocation]} 
              selectedRiderId={currentUser?.id || null} 
              onRiderSelect={() => {}}
            />
          )}
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div>
              <span className="text-gray-500">Model:</span>
              <div className="font-medium">{assignedBike.model}</div>
            </div>
            <div>
              <span className="text-gray-500">Registration:</span>
              <div className="font-medium">{assignedBike.registrationNumber}</div>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleViewFullTracker}
          >
            <Navigation className="mr-2 h-4 w-4" />
            View Full Tracker
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
