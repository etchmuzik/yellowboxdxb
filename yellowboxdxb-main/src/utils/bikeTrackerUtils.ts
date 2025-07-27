
import { RiderLocation } from "@/components/bike-tracker/types";

// Dubai districts for random assignment
export const dubaiDistricts = [
  "Dubai Marina",
  "Downtown Dubai",
  "Deira",
  "Jumeirah",
  "Al Quoz",
  "Business Bay",
  "JLT",
  "Palm Jumeirah",
  "Dubai Silicon Oasis",
  "Al Barsha"
];

// Bike types
export const bikeTypes = ["Motorcycle", "Electric Scooter", "Delivery Bike"];

// Rider names (Dubai-appropriate international names)
export const riderNames = [
  "Ahmed Ali",
  "John Smith",
  "Rajesh Kumar",
  "Mohammed Abdullah",
  "Sara Khan",
  "Li Wei",
  "Omar Hassan",
  "Fatima Al-Zahra",
  "Alexander Petrov",
  "Maria Rodriguez"
];

// Bike models
export const bikeModels = [
  "Honda Wave 125",
  "Yamaha YBR 150",
  "TVS Star City",
  "Bajaj Pulsar 125",
  "Honda CBF 150",
  "Suzuki GD 110",
  "Hero Splendor Plus",
  "Royal Enfield Classic 350"
];

// Helper function to get random element from array
export const getRandomElement = <T,>(array: T[]): T => 
  array[Math.floor(Math.random() * array.length)];

// Helper function to get random status with weighted distribution
export const getRandomStatus = (): 'Active' | 'Idle' | 'Offline' => {
  const rand = Math.random();
  if (rand < 0.7) return 'Active';
  if (rand < 0.9) return 'Idle';
  return 'Offline';
};

// Generate a complete rider location object
export const generateRiderLocation = (riderId: string): RiderLocation => {
  const bikeModel = getRandomElement(bikeModels);
  const gpsId = `GPS${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  
  return {
    riderId,
    riderName: getRandomElement(riderNames),
    bikeType: getRandomElement(bikeTypes),
    bikeModel,
    bikeRegistration: `DXB-${Math.floor(1000 + Math.random() * 9000)}`,
    gpsTrackerId: gpsId,
    district: getRandomElement(dubaiDistricts),
    status: getRandomStatus(),
    lastUpdated: new Date().toISOString(),
    latitude: 25.2048 + (Math.random() - 0.5) * 0.02,
    longitude: 55.2708 + (Math.random() - 0.5) * 0.02,
    speed: Math.floor(Math.random() * 30),
    heading: Math.floor(Math.random() * 360),
    timestamp: Date.now(),
    photo: undefined
  };
};

// Generate a random movement update to an existing rider location
export const updateRiderLocation = (location: RiderLocation): RiderLocation => {
  const latChange = (Math.random() - 0.5) * 0.001;
  const lngChange = (Math.random() - 0.5) * 0.001;
  const speed = Math.floor(Math.random() * 30);
  const heading = Math.floor(Math.random() * 360);
  
  // Only change status occasionally
  const shouldUpdateStatus = Math.random() < 0.05; // 5% chance to change status
  const status = shouldUpdateStatus ? getRandomStatus() : location.status;

  return {
    ...location,
    latitude: location.latitude + latChange,
    longitude: location.longitude + lngChange,
    speed,
    heading,
    timestamp: Date.now(),
    lastUpdated: new Date().toISOString(),
    status
  };
};
