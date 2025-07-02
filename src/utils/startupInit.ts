import { initializeBikeLocationsForExistingRiders } from './initializeBikeLocations';

// This function is called once on app startup
export async function initializeAppData() {
  try {
    console.log('Initializing app data...');
    
    // Check if this is the first run
    const hasInitialized = localStorage.getItem('yellowbox-initialized');
    
    if (!hasInitialized) {
      // Initialize bike locations for existing riders
      await initializeBikeLocationsForExistingRiders();
      
      // Mark as initialized
      localStorage.setItem('yellowbox-initialized', 'true');
      localStorage.setItem('yellowbox-init-date', new Date().toISOString());
      
      console.log('App data initialized successfully');
    } else {
      console.log('App already initialized on:', localStorage.getItem('yellowbox-init-date'));
    }
  } catch (error) {
    console.error('Error initializing app data:', error);
  }
}