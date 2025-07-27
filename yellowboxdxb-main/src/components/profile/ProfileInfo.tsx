
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import { Rider } from "@/types";
import { memo } from "react";

interface ProfileInfoProps {
  rider: Pick<Rider, "fullName" | "email" | "phone" | "nationality" | "bikeType">;
}

export const ProfileInfo = memo(function ProfileInfo({ rider }: ProfileInfoProps) {
  return (
    <Card className="border-t-2 border-t-nike-red">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-nike-red" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
          <div>
            <div className="text-sm text-muted-foreground">Full Name</div>
            <div className="font-medium">{rider.fullName}</div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground">Email</div>
            <div className="font-medium">{rider.email}</div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground">Phone</div>
            <div className="font-medium">{rider.phone}</div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground">Nationality</div>
            <div className="font-medium">{rider.nationality}</div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground">Bike Type</div>
            <div className="font-medium">{rider.bikeType}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
