import { useState, useEffect } from 'react';
import { RiderLocation } from './types';
import { BikeTrackerService, BikeLocation } from '@/services/bikeTrackerService';

export const useRiderLocations = () => {
  const [locations, setLocations] = useState<RiderLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    
    // Subscribe to real-time location updates from Firebase
    const unsubscribe = BikeTrackerService.subscribeToLocations((bikeLocations: BikeLocation[]) => {
      // Convert BikeLocation to RiderLocation format
      const riderLocations: RiderLocation[] = bikeLocations.map(location => ({
        riderId: location.riderId,
        riderName: location.riderName,
        bikeId: location.bikeId,
        bikeModel: location.bikeModel,
        bikeType: location.bikeType,
        bikeRegistration: location.bikeRegistration,
        gpsTrackerId: location.gpsTrackerId,
        position: {
          lat: location.latitude,
          lng: location.longitude
        },
        latitude: location.latitude,
        longitude: location.longitude,
        status: location.status,
        lastUpdate: location.lastUpdate,
        speed: location.speed,
        battery: location.battery,
        district: location.district
      }));
      
      setLocations(riderLocations);
      setIsLoading(false);
    });

    // Clean up subscription on unmount
    return () => unsubscribe();
  }, []);

  const refreshLocations = () => {
    // The subscription will automatically update with any changes
    // This is just for UI feedback
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  return {
    locations,
    isLoading,
    refreshLocations
  };
};