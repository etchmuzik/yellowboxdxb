import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { StageBadge } from '@/components/ui/StatusBadge';
import { ApplicationStage } from '@/types';

interface PipelineViewProps {
  ridersByStage: Record<ApplicationStage, number>;
  totalRiders: number;
}

const PIPELINE_STAGES: ApplicationStage[] = [
  'Applied', 
  'Docs Verified', 
  'Theory Test', 
  'Road Test', 
  'Medical', 
  'ID Issued'
];

export const PipelineView = React.memo(function PipelineView({ 
  ridersByStage, 
  totalRiders 
}: PipelineViewProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {PIPELINE_STAGES.map((stage) => {
            const count = ridersByStage[stage] || 0;
            const percentage = totalRiders > 0 ? (count / totalRiders) * 100 : 0;
            
            return (
              <div key={stage} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StageBadge stage={stage} />
                    <span className="text-sm font-medium">
                      {count} riders
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/riders?stage=${stage}`)}
                  >
                    View
                  </Button>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
});