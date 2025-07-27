import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  progress?: number;
  badges?: Array<{
    label: string;
    value: number;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  }>;
}

export const MetricCard = React.memo(function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  progress,
  badges 
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {progress !== undefined && (
          <Progress value={progress} className="h-2 mt-2" />
        )}
        {badges && badges.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {badges.map((badge, index) => (
              <Badge key={index} variant={badge.variant || 'default'} className="text-xs">
                {badge.value} {badge.label}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});