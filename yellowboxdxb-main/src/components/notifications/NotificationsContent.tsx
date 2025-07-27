
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, AlertCircle, Check, Clock } from "lucide-react";
// Placeholder notification data - will be replaced with Firebase implementation
const mockNotifications = [
  {
    id: "n1",
    title: "Test Result Alert",
    message: "A rider has failed the Road Test.",
    type: "alert",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    read: false,
  },
  {
    id: "n2",
    title: "Budget Alert",
    message: "Monthly spending has reached 85% of allocated budget.",
    type: "alert",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    read: false,
  },
  {
    id: "n3",
    title: "New Rider Application",
    message: "A new rider has submitted an application.",
    type: "info",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    read: true,
  },
  {
    id: "n4",
    title: "Rider Onboarded",
    message: "A rider has completed all onboarding steps.",
    type: "success",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
  },
  {
    id: "n5",
    title: "Document Expiry Warning",
    message: "A rider's visa will expire in 14 days.",
    type: "warning",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
    read: false,
  },
  {
    id: "n6",
    title: "Expense Approved",
    message: "A uniform expense has been approved.",
    type: "success",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    read: true,
  },
  {
    id: "n7",
    title: "System Update",
    message: "The Driver Spend Monitor system has been updated to version 1.2.0.",
    type: "info",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    read: true,
  },
];

export function NotificationsContent() {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [currentTab, setCurrentTab] = useState("all");

  const filteredNotifications = notifications.filter(notification => {
    if (currentTab === "all") return true;
    if (currentTab === "unread") return !notification.read;
    if (currentTab === "alerts") return notification.type === "alert" || notification.type === "warning";
    return true;
  });

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'success':
        return <Check className="h-5 w-5 text-green-500" />;
      case 'info':
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-1">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with alerts and important events
          </p>
        </div>
        
        <Button variant="outline" onClick={markAllAsRead}>
          Mark All as Read
        </Button>
      </div>

      <Tabs defaultValue="all" onValueChange={setCurrentTab}>
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="all">
            All
            <span className="ml-1 text-xs bg-slate-200 text-slate-700 rounded-full px-2 py-0.5">
              {notifications.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <span className="ml-1 text-xs bg-nike-red text-white rounded-full px-2 py-0.5">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value={currentTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {currentTab === "all" ? "All Notifications" : 
                 currentTab === "unread" ? "Unread Notifications" : "Alert Notifications"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-lg font-medium">No notifications to display</p>
                  <p className="text-sm">You're all caught up!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        !notification.read ? 'bg-muted border-muted-foreground/20' : 'bg-white'
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">{getIconForType(notification.type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-medium ${!notification.read ? 'font-bold' : ''}`}>
                              {notification.title}
                            </h4>
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm mt-1">{notification.message}</p>
                          {!notification.read && (
                            <div className="mt-2 text-right">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs h-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                              >
                                Mark as read
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
