
import { useState, useEffect } from 'react';

// API key storage key - make sure it matches with Settings component
const GOOGLE_MAPS_API_KEY = "yellowbox-google-maps-api-key";
// Get API key from environment - required for production
const DEFAULT_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Check if the API key is the placeholder or missing
const isValidApiKey = DEFAULT_GOOGLE_MAPS_API_KEY && 
  DEFAULT_GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

if (!isValidApiKey) {
  console.warn(
    'Google Maps API key is not configured. Map features will be disabled. ' +
    'Please set VITE_GOOGLE_MAPS_API_KEY in your .env file with a valid API key.'
  );
}

interface UseGoogleMapsApiReturn {
  apiKey: string | null;
  isLoaded: boolean;
  isError: boolean;
}

export const useGoogleMapsApi = (): UseGoogleMapsApiReturn => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    try {
      const savedApiKey = localStorage.getItem(GOOGLE_MAPS_API_KEY);
      if (savedApiKey && savedApiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        setApiKey(savedApiKey);
        setIsLoaded(true);
      } else if (isValidApiKey) {
        // Use the default API key if none is saved and it's valid
        setApiKey(DEFAULT_GOOGLE_MAPS_API_KEY);
        // Save it to localStorage for future use
        localStorage.setItem(GOOGLE_MAPS_API_KEY, DEFAULT_GOOGLE_MAPS_API_KEY);
        setIsLoaded(true);
      } else {
        // No valid API key available
        setApiKey(null);
        setIsLoaded(true);
        setIsError(true);
      }
    } catch (error) {
      console.error("Error accessing Google Maps API key:", error);
      if (isValidApiKey) {
        // Even on error, use the default API key if it's valid
        setApiKey(DEFAULT_GOOGLE_MAPS_API_KEY);
        setIsLoaded(true);
        setIsError(false);
      } else {
        setApiKey(null);
        setIsLoaded(true);
        setIsError(true);
      }
    }
  }, []);

  return { apiKey, isLoaded, isError };
};
