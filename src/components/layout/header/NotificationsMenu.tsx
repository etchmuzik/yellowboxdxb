
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Notification = {
  id: number;
  text: string;
  read: boolean;
  time: string;
};

export function NotificationsMenu() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, text: "Ahmed Hassan started new delivery", read: false, time: "10 min ago" },
    { id: 2, text: "Sara's road test passed", read: false, time: "25 min ago" },
    { id: 3, text: "Budget alert: 85% spent this month", read: true, time: "1 hour ago" },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast({
      title: "Notifications",
      description: "All notifications marked as read",
    });
  };

  const handleNotificationClick = (id: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    navigate("/notifications");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-nike-red text-[10px] font-medium text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2 border-b">
          <span className="font-medium">Notifications</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs h-6"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-auto">
          {notifications.length === 0 ? (
            <div className="py-6 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem 
                key={notification.id}
                className={cn(
                  "flex flex-col items-start p-3 cursor-pointer",
                  !notification.read && "bg-muted/50"
                )}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="font-medium text-left">{notification.text}</div>
                <div className="text-xs text-muted-foreground mt-1">{notification.time}</div>
              </DropdownMenuItem>
            ))
          )}
        </div>
        <div className="p-2 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-center text-center"
            onClick={() => navigate("/notifications")}
          >
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
