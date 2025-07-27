
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { Search, Download, Filter } from "lucide-react";
// Activity component - will use real Firebase data when activity logging is implemented

// Mock activity log data
const activityTypes = [
  "User Login",
  "User Logout",
  "Expense Added",
  "Expense Edited",
  "Expense Deleted",
  "Rider Added",
  "Rider Updated",
  "Test Status Changed",
  "Budget Updated",
  "Report Generated",
  "Document Uploaded",
  "Email Sent",
  "SMS Sent",
];

const users = [
  "Admin User",
  "Operations Manager",
  "Finance Officer"
];

const generateMockActivity = (count: number) => {
  const activities = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const daysAgo = Math.floor(Math.random() * 7);
    const hoursAgo = Math.floor(Math.random() * 24);
    const minutesAgo = Math.floor(Math.random() * 60);
    
    const timestamp = new Date(now);
    timestamp.setDate(timestamp.getDate() - daysAgo);
    timestamp.setHours(timestamp.getHours() - hoursAgo);
    timestamp.setMinutes(timestamp.getMinutes() - minutesAgo);
    
    // Generate a description based on the activity type
    let description = "";
    switch (activityType) {
      case "User Login":
        description = `${user} logged into the system`;
        break;
      case "User Logout":
        description = `${user} logged out of the system`;
        break;
      case "Expense Added":
        description = `${user} added a new expense record`;
        break;
      case "Expense Edited":
        description = `${user} edited an expense record`;
        break;
      case "Expense Deleted":
        description = `${user} deleted an expense record`;
        break;
      case "Rider Added":
        description = `${user} added a new rider`;
        break;
      case "Rider Updated":
        description = `${user} updated rider information`;
        break;
      case "Test Status Changed":
        description = `${user} changed a test status`;
        break;
      case "Budget Updated":
        description = `${user} updated the monthly budget`;
        break;
      case "Report Generated":
        description = `${user} generated a report`;
        break;
      case "Document Uploaded":
        description = `${user} uploaded a new document`;
        break;
      case "Email Sent":
        description = `System sent an email notification`;
        break;
      case "SMS Sent":
        description = `System sent an SMS notification`;
        break;
      default:
        description = `${user} performed an action`;
    }
    
    activities.push({
      id: `activity-${i}`,
      timestamp: timestamp.toISOString(),
      type: activityType,
      user,
      description,
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    });
  }
  
  // Sort by timestamp (newest first)
  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const mockActivityLog = generateMockActivity(50);

export function ActivityContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [activities, setActivities] = useState(mockActivityLog);

  // Filter activities based on search and date range
  const filteredActivities = activities.filter(activity => {
    // Search filter
    const matchesSearch = searchQuery === "" || 
      activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Date range filter
    const matchesDateRange = !dateRange?.from || !dateRange?.to || 
      (new Date(activity.timestamp) >= dateRange.from && 
       new Date(activity.timestamp) <= dateRange.to);
    
    return matchesSearch && matchesDateRange;
  });

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-AE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Activity Log</h1>
          <p className="text-muted-foreground">
            Audit trail of all system activities
          </p>
        </div>
        
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> Export Log
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <DatePickerWithRange date={dateRange} setDate={setDateRange} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>System Activity</CardTitle>
          <div className="text-sm text-muted-foreground">
            {filteredActivities.length} entries found
          </div>
        </CardHeader>
        <CardContent>
          {filteredActivities.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No activities match your search criteria
            </div>
          ) : (
            <div className="space-y-6">
              {filteredActivities.map((activity, index) => {
                // Group activities by date
                const currentDate = formatDate(activity.timestamp);
                const prevDate = index > 0 ? formatDate(filteredActivities[index - 1].timestamp) : null;
                const showDateHeader = index === 0 || currentDate !== prevDate;
                
                return (
                  <div key={activity.id}>
                    {showDateHeader && (
                      <div className="mb-4 mt-8 first:mt-0 border-b pb-1">
                        <h3 className="font-medium text-muted-foreground">{currentDate}</h3>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3 pb-4 border-b border-border/30 last:border-0">
                      <div className="w-12 text-xs text-muted-foreground pt-0.5">
                        {formatTime(activity.timestamp)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            activity.type.includes("Expense") ? "bg-blue-500" :
                            activity.type.includes("Rider") ? "bg-green-500" :
                            activity.type.includes("Test") ? "bg-purple-500" :
                            activity.type.includes("User") ? "bg-yellow-500" :
                            "bg-slate-500"
                          }`}></div>
                          <span className="font-medium text-sm">{activity.type}</span>
                        </div>
                        <p className="text-sm mt-1">{activity.description}</p>
                        <div className="flex text-xs text-muted-foreground mt-1">
                          <div>IP: {activity.ipAddress}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
