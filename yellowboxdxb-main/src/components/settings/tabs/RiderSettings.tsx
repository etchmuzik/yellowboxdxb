import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { User, Globe, Bell, MapPin, Save } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export function RiderSettings() {
  const [settings, setSettings] = useState({
    language: "en",
    timezone: "Asia/Dubai",
    locationSharing: true,
    bikeStatusNotifications: true,
    maintenanceReminders: true,
    shiftReminders: true,
    displayUnits: "metric", // metric or imperial
    mapView: "satellite", // standard, satellite, terrain
  });

  // Load saved settings
  useEffect(() => {
    const savedSettings = localStorage.getItem("rider-personal-settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("rider-personal-settings", JSON.stringify(settings));
    toast({
      title: "Settings Saved",
      description: "Your personal preferences have been updated.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Language & Region
          </CardTitle>
          <CardDescription>
            Configure your language and regional preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Display Language</Label>
            <Select
              value={settings.language}
              onValueChange={(value) => setSettings({ ...settings, language: value })}
            >
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">Arabic (العربية)</SelectItem>
                <SelectItem value="hi">Hindi (हिन्दी)</SelectItem>
                <SelectItem value="ur">Urdu (اردو)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={settings.timezone}
              onValueChange={(value) => setSettings({ ...settings, timezone: value })}
            >
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Dubai">Dubai (GMT+4)</SelectItem>
                <SelectItem value="Asia/Kolkata">India (GMT+5:30)</SelectItem>
                <SelectItem value="Asia/Karachi">Pakistan (GMT+5)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="units">Display Units</Label>
            <Select
              value={settings.displayUnits}
              onValueChange={(value) => setSettings({ ...settings, displayUnits: value })}
            >
              <SelectTrigger id="units">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">Metric (km, kg)</SelectItem>
                <SelectItem value="imperial">Imperial (miles, lbs)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location & Map Settings
          </CardTitle>
          <CardDescription>
            Control location sharing and map preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="location-sharing">Location Sharing</Label>
              <p className="text-sm text-muted-foreground">
                Share your location for delivery tracking
              </p>
            </div>
            <Switch
              id="location-sharing"
              checked={settings.locationSharing}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, locationSharing: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="map-view">Preferred Map View</Label>
            <Select
              value={settings.mapView}
              onValueChange={(value) => setSettings({ ...settings, mapView: value })}
            >
              <SelectTrigger id="map-view">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="satellite">Satellite</SelectItem>
                <SelectItem value="terrain">Terrain</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose which notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="bike-status">Bike Status Updates</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about bike assignment changes
              </p>
            </div>
            <Switch
              id="bike-status"
              checked={settings.bikeStatusNotifications}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, bikeStatusNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenance">Maintenance Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Receive bike maintenance and service reminders
              </p>
            </div>
            <Switch
              id="maintenance"
              checked={settings.maintenanceReminders}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, maintenanceReminders: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="shift">Shift Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about upcoming shifts
              </p>
            </div>
            <Switch
              id="shift"
              checked={settings.shiftReminders}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, shiftReminders: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Preferences
        </Button>
      </div>
    </div>
  );
}