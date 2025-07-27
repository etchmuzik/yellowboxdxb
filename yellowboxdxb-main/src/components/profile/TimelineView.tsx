
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface TimelineEvent {
  title: string;
  date: string;
  description: string;
  status: "completed" | "current" | "upcoming";
}

interface TimelineViewProps {
  events: TimelineEvent[];
  formatDate: (dateString: string) => string;
}

export function TimelineView({ events, formatDate }: TimelineViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-purple-600" />
          Application Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {events.map((event, index) => (
            <div 
              key={index} 
              className={`relative pl-6 ${
                index < events.length - 1 ? "pb-6" : ""
              } border-l-2 ${
                event.status === "completed" 
                  ? "border-green-200" 
                  : event.status === "current" 
                    ? "border-yellowbox-yellow/50" 
                    : "border-gray-200"
              }`}
            >
              <div 
                className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${
                  event.status === "completed" 
                    ? "bg-green-500" 
                    : event.status === "current" 
                      ? "bg-yellowbox-yellow" 
                      : "bg-gray-300"
                }`}
              ></div>
              <div className={`font-medium ${event.status === "upcoming" ? "text-muted-foreground" : ""}`}>
                {event.title}
              </div>
              <div className="text-sm text-muted-foreground">{event.date}</div>
              <div className="text-sm mt-1">{event.description}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
