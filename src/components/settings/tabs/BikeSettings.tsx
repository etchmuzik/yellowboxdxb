import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bike as BikeIcon } from "lucide-react";

export function BikeSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BikeIcon className="h-5 w-5" />
          Bike Management
        </CardTitle>
        <CardDescription>
          Manage bike inventory and assignments
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <BikeIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Bike Management Coming Soon</h3>
          <p className="text-muted-foreground">
            This feature will allow you to manage bike inventory, track GPS locations, 
            and assign bikes to riders. It will be connected to Firebase for real-time data.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}