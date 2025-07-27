
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { BikeMap } from "./BikeMap";
import { MapPin, Clock, Bike } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { RiderLocation } from "./types";
import { parseDate } from "@/utils/dateUtils";

interface LiveMapCardProps {
  riderLocations: RiderLocation[];
  selectedRider: string | null;
  setSelectedRider: (riderId: string) => void;
}

export function LiveMapCard({
  riderLocations,
  selectedRider,
  setSelectedRider,
}: LiveMapCardProps) {
  const selectedRiderData = selectedRider
    ? riderLocations.find((r) => r.riderId === selectedRider)
    : null;

  return (
    <Card className="lg:col-span-2 shadow-md overflow-hidden border-t-2 border-t-yellowbox-yellow transition-all duration-200 hover:shadow-lg">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-yellowbox-yellow" />
              Dubai Live Tracker
            </CardTitle>
            <CardDescription className="mt-1">
              {selectedRiderData ? (
                <div className="flex flex-col">
                  <span className="font-medium text-yellowbox-yellow">
                    {selectedRiderData.riderName}
                  </span>
                  <div className="flex flex-wrap items-center gap-1 text-xs">
                    <span className="flex items-center">
                      <Bike className="h-3 w-3 mr-1" />
                      {selectedRiderData.bikeModel || selectedRiderData.bikeType}
                    </span>
                    {selectedRiderData.gpsTrackerId && (
                      <>
                        <span>•</span>
                        <span>GPS: {selectedRiderData.gpsTrackerId}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>{selectedRiderData.district}</span>
                    <span>•</span>
                    <span>{selectedRiderData.speed} km/h</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(parseDate(selectedRiderData.lastUpdated), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              ) : (
                "Showing all active riders across Dubai"
              )}
            </CardDescription>
          </div>
          {selectedRiderData && (
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              selectedRiderData.status === "Active" 
                ? "bg-green-100 text-green-800" 
                : selectedRiderData.status === "Idle"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
            }`}>
              {selectedRiderData.status}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[500px] w-full rounded-b-lg overflow-hidden">
          <BikeMap
            riders={riderLocations}
            selectedRiderId={selectedRider}
            onRiderSelect={setSelectedRider}
          />
        </div>
      </CardContent>
    </Card>
  );
}
