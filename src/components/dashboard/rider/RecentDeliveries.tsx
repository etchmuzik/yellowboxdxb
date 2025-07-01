
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { parseDate } from "@/utils/dateUtils";

interface Delivery {
  id: string;
  destination: string;
  dateTime: string;
  status: "Completed" | "Pending" | "Cancelled";
  amount: number;
}

export function RecentDeliveries() {
  // Mock delivery data - in a real app this would come from an API
  const deliveries: Delivery[] = [
    {
      id: "D001",
      destination: "Business Bay, Dubai",
      dateTime: "2025-05-15T14:30:00.000Z",
      status: "Completed",
      amount: 85.00
    },
    {
      id: "D002",
      destination: "Dubai Marina",
      dateTime: "2025-05-14T19:15:00.000Z",
      status: "Completed",
      amount: 120.50
    },
    {
      id: "D003",
      destination: "Dubai Mall",
      dateTime: "2025-05-16T08:45:00.000Z",
      status: "Pending",
      amount: 65.75
    },
    {
      id: "D004",
      destination: "Palm Jumeirah",
      dateTime: "2025-05-13T11:20:00.000Z",
      status: "Cancelled",
      amount: 200.00
    }
  ];

  // Calculate delivery statistics
  const stats = {
    completed: deliveries.filter(d => d.status === "Completed").length,
    pending: deliveries.filter(d => d.status === "Pending").length,
    cancelled: deliveries.filter(d => d.status === "Cancelled").length,
    total: deliveries.length,
    totalEarned: deliveries
      .filter(d => d.status === "Completed")
      .reduce((sum, delivery) => sum + delivery.amount, 0)
  };

  const getStatusClass = (status: Delivery["status"]) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="shadow-md border-t-2 border-t-blue-500">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Recent Deliveries
            </CardTitle>
            <CardDescription>Your delivery history</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">Earned</div>
            <div className="text-2xl font-bold">{stats.totalEarned.toFixed(2)} AED</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-500">Completed</div>
            <div className="font-bold text-green-600">{stats.completed}</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-500">Pending</div>
            <div className="font-bold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-md">
            <div className="text-sm text-gray-500">Cancelled</div>
            <div className="font-bold text-red-600">{stats.cancelled}</div>
          </div>
        </div>
        
        <div className="space-y-3">
          {deliveries.map((delivery) => (
            <div 
              key={delivery.id}
              className="flex items-center justify-between border-b pb-3 last:border-0"
            >
              <div>
                <div className="font-medium">{delivery.destination}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(parseDate(delivery.dateTime), { addSuffix: true })}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <span className="font-medium">{delivery.amount.toFixed(2)} AED</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(delivery.status)}`}>
                  {delivery.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
