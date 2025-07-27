import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Rider } from '@/types';

interface RidersNeedingAttentionProps {
  riders: Rider[];
}

export const RidersNeedingAttention = React.memo(function RidersNeedingAttention({ 
  riders 
}: RidersNeedingAttentionProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riders Needing Attention</CardTitle>
      </CardHeader>
      <CardContent>
        {riders.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            All riders are progressing normally
          </p>
        ) : (
          <div className="space-y-4">
            {riders.map((rider) => (
              <div 
                key={rider.id} 
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-3 rounded-lg transition-colors"
                onClick={() => navigate(`/riders/${rider.id}`)}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{rider.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {rider.applicationStage} • {rider.nationality}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {(rider.testStatus.theory === 'Fail' || rider.testStatus.road === 'Fail') && (
                    <Badge variant="destructive" className="mb-1">
                      Test Failed
                    </Badge>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(rider.joinDate), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});