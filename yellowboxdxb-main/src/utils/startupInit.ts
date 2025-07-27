import { initializeBikeLocationsForExistingRiders } from './initializeBikeLocations';

// This function is called once on app startup
export async function initializeAppData() {
  try {
    
    // Check if this is the first run
    const hasInitialized = localStorage.getItem('yellowbox-initialized');
    
    if (!hasInitialized) {
      // Initialize bike locations for existing riders
      await initializeBikeLocationsForExistingRiders();
      
      // Mark as initialized
      localStorage.setItem('yellowbox-initialized', 'true');
      localStorage.setItem('yellowbox-init-date', new Date().toISOString());
      
    } else {
      console.log('Yellow Box already initialized');
    }
  } catch (error) {
    console.error('Error initializing app data:', error);
    // Don't throw the error - allow app to continue
    // The app should work even if initialization fails
  }
}