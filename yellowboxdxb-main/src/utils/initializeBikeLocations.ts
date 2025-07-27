import { BikeTrackerService } from '@/services/bikeTrackerService';
import { RiderFirestoreService } from '@/services/riderFirestoreService';

// Function to initialize bike locations for existing riders
export async function initializeBikeLocationsForExistingRiders() {
  try {
    // Get all riders
    const riders = await RiderFirestoreService.getAllRiders();
    
    // Initialize location for each rider
    for (const rider of riders) {
      if (rider.assignedBikeId) {
        await BikeTrackerService.initializeRiderLocation(rider.id, {
          riderName: rider.fullName,
          bikeId: rider.assignedBikeId,
          bikeModel: rider.bikeType || 'Standard Bike',
          bikeType: rider.bikeType,
          bikeRegistration: `DXB-${rider.id.slice(-4).toUpperCase()}`,
          gpsTrackerId: `GPS-${rider.id.slice(-6).toUpperCase()}`
        });
        
      }
    }
    
  } catch (error) {
    console.error('Error initializing rider locations:', error);
  }
}

// Function to be called when a new rider is added
export async function initializeBikeLocationForNewRider(riderId: string) {
  try {
    const rider = await RiderFirestoreService.getRiderById(riderId);
    
    if (rider && rider.assignedBikeId) {
      await BikeTrackerService.initializeRiderLocation(rider.id, {
        riderName: rider.fullName,
        bikeId: rider.assignedBikeId,
        bikeModel: rider.bikeType || 'Standard Bike',
        bikeType: rider.bikeType,
        bikeRegistration: `DXB-${rider.id.slice(-4).toUpperCase()}`,
        gpsTrackerId: `GPS-${rider.id.slice(-6).toUpperCase()}`
      });
      
    }
  } catch (error) {
    console.error('Error initializing location for new rider:', error);
  }
}