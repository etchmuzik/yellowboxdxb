
import { useState } from "react";
import { RidersList } from "./RidersList";
import { LiveMapCardWithSuspense as LiveMapCard } from "@/components/ui/lazy-components";
import { ActivityLog } from "./ActivityLog";
import { useRiderLocations } from "./useRiderLocations";
import { MapIcon, MapPinIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function BikeTrackerContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRider, setSelectedRider] = useState<string | null>(null);
  const { locations, isLoading } = useRiderLocations();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <MapPinIcon className="h-8 w-8 text-yellowbox-yellow" />
        <div>
          <h1 className="text-3xl font-bold mb-1 text-yellowbox-yellow">Dubai Live Tracker</h1>
          <p className="text-muted-foreground">
            Monitor rider locations and status across Dubai in real-time
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellowbox-yellow"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <RidersList
            riderLocations={locations}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedRider={selectedRider}
            setSelectedRider={setSelectedRider}
          />

          <LiveMapCard
            riderLocations={locations}
            selectedRider={selectedRider}
            setSelectedRider={setSelectedRider}
          />
        </div>
      )}

      <ActivityLog />
    </div>
  );
}
