import { useState, useEffect } from 'react';
import { RiderLocation } from './types';

// Dubai center coordinates
const DUBAI_CENTER = {
  lat: 25.2048,
  lng: 55.2708
};

// Dubai districts with approximate coordinates
const DUBAI_DISTRICTS = [
  { name: "Dubai Marina", lat: 25.0701, lng: 55.1397 },
  { name: "Downtown Dubai", lat: 25.1972, lng: 55.2744 },
  { name: "Deira", lat: 25.2788, lng: 55.3242 },
  { name: "Jumeirah", lat: 25.2048, lng: 55.2708 },
  { name: "Al Quoz", lat: 25.1539, lng: 55.2362 },
  { name: "Business Bay", lat: 25.1857, lng: 55.2795 },
  { name: "JLT", lat: 25.0675, lng: 55.1376 },
  { name: "Palm Jumeirah", lat: 25.1124, lng: 55.1390 },
  { name: "Dubai Silicon Oasis", lat: 25.1279, lng: 55.3807 },
  { name: "Al Barsha", lat: 25.1112, lng: 55.2130 }
];

// Mock rider names for demo purposes
const MOCK_RIDERS = [
  "Ahmed Al-Mansouri",
  "Fatima Hassan", 
  "Mohammed Ali",
  "Sara Abdullah",
  "Omar Khalil"
];

export const useRiderLocations = () => {
  const [locations, setLocations] = useState<RiderLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API loading
    setIsLoading(true);
    
    // Generate mock locations for demo purposes
    // In production, this would fetch real rider locations from Firebase
    const generateMockLocations = () => {
      const mockLocations: RiderLocation[] = MOCK_RIDERS.map((riderName, index) => {
        const district = DUBAI_DISTRICTS[Math.floor(Math.random() * DUBAI_DISTRICTS.length)];
        
        // Add some random offset to make locations more realistic
        const latOffset = (Math.random() - 0.5) * 0.01;
        const lngOffset = (Math.random() - 0.5) * 0.01;
        
        return {
          riderId: `R${String(index + 1).padStart(3, '0')}`,
          riderName,
          bikeId: `B${String(index + 1).padStart(3, '0')}`,
          bikeModel: `Honda Bike ${index + 1}`,
          position: {
            lat: district.lat + latOffset,
            lng: district.lng + lngOffset
          },
          status: Math.random() > 0.3 ? 'Active' : 'Idle',
          lastUpdate: new Date(),
          speed: Math.random() > 0.5 ? Math.floor(Math.random() * 40) + 10 : 0,
          battery: Math.floor(Math.random() * 40) + 60,
          district: district.name
        };
      });
      
      setLocations(mockLocations);
      setIsLoading(false);
    };

    // Simulate API delay
    setTimeout(generateMockLocations, 1000);

    // Set up interval for location updates (every 5 seconds)
    const updateInterval = setInterval(() => {
      setLocations(prevLocations => 
        prevLocations.map(location => {
          // Simulate movement
          const latChange = (Math.random() - 0.5) * 0.001;
          const lngChange = (Math.random() - 0.5) * 0.001;
          
          return {
            ...location,
            position: {
              lat: location.position.lat + latChange,
              lng: location.position.lng + lngChange
            },
            lastUpdate: new Date(),
            speed: location.status === 'Active' ? Math.floor(Math.random() * 40) + 10 : 0,
            battery: Math.max(10, location.battery - Math.random() * 2)
          };
        })
      );
    }, 5000);

    return () => clearInterval(updateInterval);
  }, []);

  return {
    locations,
    isLoading,
    refreshLocations: () => {
      // In production, this would fetch fresh data from Firebase
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 1000);
    }
  };
};