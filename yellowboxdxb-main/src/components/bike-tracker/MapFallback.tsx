import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function MapFallback() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px] bg-gray-50 rounded-lg">
      <Alert className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Maps Unavailable</AlertTitle>
        <AlertDescription className="mt-2">
          <p className="mb-4">
            Google Maps is not configured. To enable map features, please add a valid Google Maps API key in Settings.
          </p>
          <div className="space-y-2">
            <p className="text-sm">To get an API key:</p>
            <ol className="text-sm list-decimal list-inside space-y-1">
              <li>Go to the Google Cloud Console</li>
              <li>Create a new project or select existing</li>
              <li>Enable Maps JavaScript API</li>
              <li>Create credentials (API Key)</li>
              <li>Add the key in Settings → API Configuration</li>
            </ol>
          </div>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => window.location.href = '/settings'}
          >
            Go to Settings
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}