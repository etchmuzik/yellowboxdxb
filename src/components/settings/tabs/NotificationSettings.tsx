
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

// Notification preferences storage key
const NOTIFICATION_PREFERENCES_KEY = "nike-rider-notification-preferences";

export function NotificationSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  // Load saved notification preferences on mount
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem(NOTIFICATION_PREFERENCES_KEY);
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        setEmailNotifications(preferences.email);
        setSmsNotifications(preferences.sms);
        setInAppNotifications(preferences.inApp);
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
    }
  }, []);

  const saveNotificationSettings = () => {
    const preferences = {
      email: emailNotifications,
      sms: smsNotifications,
      inApp: inAppNotifications
    };
    
    localStorage.setItem(NOTIFICATION_PREFERENCES_KEY, JSON.stringify(preferences));
    
    toast({
      title: "Notification Settings Saved",
      description: "Your notification preferences have been updated.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Configure how and when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive text messages for urgent alerts
              </p>
            </div>
            <Switch
              checked={smsNotifications}
              onCheckedChange={setSmsNotifications}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>In-App Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Show notifications in the application
              </p>
            </div>
            <Switch
              checked={inAppNotifications}
              onCheckedChange={setInAppNotifications}
            />
          </div>
        </div>
        
        <Button 
          className="w-full sm:w-auto"
          onClick={saveNotificationSettings}
        >
          Save Notification Settings
        </Button>
      </CardContent>
    </Card>
  );
}
