
import { useState, useEffect } from 'react';

// API key storage key - make sure it matches with Settings component
const GOOGLE_MAPS_API_KEY = "nike-rider-google-maps-api-key";

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
        setIsError(true);
      }
    } catch (error) {
      console.error("Error accessing Google Maps API key:", error);
      setIsError(true);
    }
  }, []);

  return { apiKey, isLoaded, isError };
};
