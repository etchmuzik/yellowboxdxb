
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

// API key storage key
const GOOGLE_MAPS_API_KEY = "nike-rider-google-maps-api-key";

export function ApiSettings() {
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState("");
  const [isApiKeyHidden, setIsApiKeyHidden] = useState(true);

  // Load saved Google Maps API key on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem(GOOGLE_MAPS_API_KEY);
    if (savedApiKey) {
      setGoogleMapsApiKey(savedApiKey);
    }
  }, []);

  const toggleApiKeyVisibility = () => {
    setIsApiKeyHidden(!isApiKeyHidden);
  };

  const saveGoogleMapsApiKey = () => {
    if (googleMapsApiKey.trim()) {
      localStorage.setItem(GOOGLE_MAPS_API_KEY, googleMapsApiKey);
      toast({
        title: "API Key Saved",
        description: "Your Google Maps API key has been saved successfully.",
      });
    } else {
      toast({
        title: "API Key Error",
        description: "Please enter a valid Google Maps API key.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
        <CardDescription>
          Configure API keys for map integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="google-maps-api-key">Google Maps API Key</Label>
          <div className="flex space-x-2">
            <Input
              id="google-maps-api-key"
              value={googleMapsApiKey}
              onChange={(e) => setGoogleMapsApiKey(e.target.value)}
              type={isApiKeyHidden ? "password" : "text"}
              className="flex-1"
              placeholder="Enter your Google Maps API key"
            />
            <Button 
              variant="outline"
              onClick={toggleApiKeyVisibility}
            >
              {isApiKeyHidden ? "Show" : "Hide"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            This API key is used for mapping rider locations across Dubai.
            <a href="https://developers.google.com/maps/documentation/javascript/get-api-key" 
               className="text-yellowbox-yellow ml-1 hover:underline" 
               target="_blank" 
               rel="noopener noreferrer">
              How to get a Google Maps API key
            </a>
          </p>
        </div>
        
        <Button 
          className="w-full sm:w-auto"
          onClick={saveGoogleMapsApiKey}
        >
          Save API Settings
        </Button>
      </CardContent>
    </Card>
  );
}
