import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Users, MapPin, FileText } from 'lucide-react';

interface QuickActionsProps {
  totalRiders: number;
  assignedBikes: number;
}

export const QuickActions = React.memo(function QuickActions({ 
  totalRiders, 
  assignedBikes 
}: QuickActionsProps) {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Manage Riders',
      subtitle: `View all ${totalRiders} riders`,
      icon: Users,
      onClick: () => navigate('/riders')
    },
    {
      title: 'Track Fleet',
      subtitle: `${assignedBikes} bikes active`,
      icon: MapPin,
      onClick: () => navigate('/bike-tracker')
    },
    {
      title: 'View Reports',
      subtitle: 'Analytics & insights',
      icon: FileText,
      onClick: () => navigate('/reports')
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {actions.map((action, index) => (
        <Card 
          key={index}
          className="cursor-pointer hover:shadow-lg transition-shadow" 
          onClick={action.onClick}
        >
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm font-medium">{action.title}</p>
              <p className="text-xs text-muted-foreground">
                {action.subtitle}
              </p>
            </div>
            <action.icon className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
});