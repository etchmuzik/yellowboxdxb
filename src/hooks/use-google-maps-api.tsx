
import { useState, useEffect } from 'react';

// API key storage key - make sure it matches with Settings component
const GOOGLE_MAPS_API_KEY = "nike-rider-google-maps-api-key";
// Default API key from environment or provided by user
const DEFAULT_GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyDIOPXP4FcgaeCEkrdxuUaNcAfBhBzOhWI";

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
      if (savedApiKey) {
        setApiKey(savedApiKey);
        setIsLoaded(true);
      } else {
        // Use the default API key if none is saved
        setApiKey(DEFAULT_GOOGLE_MAPS_API_KEY);
        // Save it to localStorage for future use
        localStorage.setItem(GOOGLE_MAPS_API_KEY, DEFAULT_GOOGLE_MAPS_API_KEY);
        setIsLoaded(true);
      }
    } catch (error) {
      console.error("Error accessing Google Maps API key:", error);
      // Even on error, use the default API key
      setApiKey(DEFAULT_GOOGLE_MAPS_API_KEY);
      setIsLoaded(true);
      setIsError(false);
    }
  }, []);

  return { apiKey, isLoaded, isError };
};
