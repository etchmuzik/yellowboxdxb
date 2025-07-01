
import React from "react";
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
// Mock riders data for activity log - will be replaced with Firebase implementation
import { Activity } from "lucide-react";

export function ActivityLog() {
  // Dubai-specific locations
  const dubaiLocations = [
    "Dubai Marina",
    "Downtown Dubai",
    "Business Bay",
    "Jumeirah Beach",
    "Deira",
    "Al Quoz",
    "Al Barsha",
    "Palm Jumeirah",
    "Dubai Silicon Oasis",
    "Dubai Media City"
  ];

  // Dubai-specific events
  const dubaiEvents = [
    "Started shift at Yellow Box hub",
    "Completed delivery",
    "Extended stop at Mall of Emirates",
    "Crossed Sheikh Zayed Road",
    "Entered Downtown zone",
    "Exited Business Bay area",
    "Speed alert on Al Khail Road",
    "Pickup from Dubai Mall",
    "Entered high-traffic area",
    "Return to Dubai Marina hub"
  ];

  return (
    <Card className="shadow-md border-t-2 border-t-yellowbox-yellow transition-all duration-200 hover:shadow-lg">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-yellowbox-yellow" />
          Dubai Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-yellowbox-yellow/20 scrollbar-track-transparent">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Rider</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(10)].map((_, i) => {
                const mockRiders = ["Ahmed Al-Mansouri", "Fatima Hassan", "Mohammed Ali", "Sara Abdullah", "Omar Khalil"];
                const rider = mockRiders[Math.floor(Math.random() * mockRiders.length)];
                const event =
                  dubaiEvents[Math.floor(Math.random() * dubaiEvents.length)];
                const location =
                  dubaiLocations[Math.floor(Math.random() * dubaiLocations.length)];
                const time = new Date();
                time.setMinutes(
                  time.getMinutes() - (i * 15 + Math.floor(Math.random() * 10))
                );

                return (
                  <TableRow key={i} className="hover:bg-muted/50">
                    <TableCell className="font-mono">{time.toLocaleTimeString("en-AE")}</TableCell>
                    <TableCell>{rider}</TableCell>
                    <TableCell>{event}</TableCell>
                    <TableCell>{location}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
