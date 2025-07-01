
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StageBadge, TestStatusBadge } from "@/components/ui/StatusBadge";
import { ApplicationStage, TestStatus } from "@/types";

interface TestStatusCardProps {
  theoryStatus: TestStatus;
  roadStatus: TestStatus;
  medicalStatus: TestStatus;
  applicationStage: ApplicationStage;
  onTheoryStatusChange: (status: TestStatus) => void;
  onRoadStatusChange: (status: TestStatus) => void;
  onMedicalStatusChange: (status: TestStatus) => void;
}

export function TestStatusCard({
  theoryStatus,
  roadStatus,
  medicalStatus,
  applicationStage,
  onTheoryStatusChange,
  onRoadStatusChange,
  onMedicalStatusChange
}: TestStatusCardProps) {
  // Status toggle handler
  const toggleStatus = (
    currentStatus: TestStatus,
    setStatus: (status: TestStatus) => void
  ) => {
    switch (currentStatus) {
      case "Pending":
        setStatus("Pass");
        break;
      case "Pass":
        setStatus("Fail");
        break;
      case "Fail":
        setStatus("Pending");
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span>Theory Test</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => toggleStatus(theoryStatus, onTheoryStatusChange)}
              >
                <TestStatusBadge status={theoryStatus} />
              </Button>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  theoryStatus === "Pass" ? "bg-green-500" 
                  : theoryStatus === "Fail" ? "bg-red-500" 
                  : "bg-yellow-500"
                }`}
                style={{ width: theoryStatus === "Pending" ? "33%" : "100%" }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span>Road Test</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => toggleStatus(roadStatus, onRoadStatusChange)}
              >
                <TestStatusBadge status={roadStatus} />
              </Button>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  roadStatus === "Pass" ? "bg-green-500" 
                  : roadStatus === "Fail" ? "bg-red-500" 
                  : "bg-yellow-500"
                }`}
                style={{ width: roadStatus === "Pending" ? "33%" : "100%" }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span>Medical</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => toggleStatus(medicalStatus, onMedicalStatusChange)}
              >
                <TestStatusBadge status={medicalStatus} />
              </Button>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  medicalStatus === "Pass" ? "bg-green-500" 
                  : medicalStatus === "Fail" ? "bg-red-500" 
                  : "bg-yellow-500"
                }`}
                style={{ width: medicalStatus === "Pending" ? "33%" : "100%" }}
              ></div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="text-sm font-medium mb-2">Current Status</div>
            <StageBadge stage={applicationStage} className="w-full flex justify-center py-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
