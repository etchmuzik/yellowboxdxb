
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, MapPin, LocateFixed, Bike } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { RiderLocation } from "./types";
import { parseDate } from "@/utils/dateUtils";

interface RidersListProps {
  riderLocations: RiderLocation[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedRider: string | null;
  setSelectedRider: (riderId: string) => void;
}

export function RidersList({
  riderLocations,
  searchQuery,
  setSearchQuery,
  selectedRider,
  setSelectedRider,
}: RidersListProps) {
  // Filter riders based on search
  const filteredRiders = riderLocations.filter(
    (rider) =>
      rider.riderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rider.bikeModel && rider.bikeModel.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rider.gpsTrackerId && rider.gpsTrackerId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      rider.district.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="lg:col-span-1 shadow-md border-t-2 border-t-yellowbox-yellow transition-all duration-200 hover:shadow-lg">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="flex items-center gap-2">
            <Bike className="h-5 w-5 text-yellowbox-yellow" />
            Riders
          </CardTitle>
          <div className="badge bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
            {riderLocations.filter((r) => r.status === "Active").length} Online
          </div>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search riders, bikes or GPS IDs..."
            className="pl-8 border-yellowbox-yellow/20 focus-visible:ring-yellowbox-yellow/30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-yellowbox-yellow/20 scrollbar-track-transparent">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Rider & Bike</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRiders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No riders match your search criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredRiders.map((rider) => (
                  <TableRow
                    key={rider.riderId}
                    className={`${
                      selectedRider === rider.riderId 
                        ? "bg-yellowbox-yellow/5 border-l-2 border-l-yellowbox-yellow" 
                        : "hover:bg-muted/50"
                    } transition-colors duration-200 cursor-pointer`}
                    onClick={() => setSelectedRider(rider.riderId)}
                  >
                    <TableCell>
                      <div className="font-medium">{rider.riderName}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        {rider.bikeModel || rider.bikeType}
                        {rider.gpsTrackerId && <span>• GPS: {rider.gpsTrackerId}</span>}
                      </div>
                      <div className={`text-xs mt-1 ${
                        rider.status === "Active"
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}>
                        {rider.status}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{rider.district}</div>
                      <div className="text-xs text-muted-foreground">
                        {rider.speed} km/h • {formatDistanceToNow(parseDate(rider.lastUpdated), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant={selectedRider === rider.riderId ? "default" : "ghost"}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRider(rider.riderId);
                        }}
                        className={selectedRider === rider.riderId ? "bg-yellowbox-yellow hover:bg-yellowbox-yellow/90" : ""}
                      >
                        <LocateFixed className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
