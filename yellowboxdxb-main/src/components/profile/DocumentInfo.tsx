
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { TestStatus } from "@/types";
import { memo } from "react";

interface DocumentInfoProps {
  visaNumber: string;
  licenseNumber: string;
  joinDate: string;
  expectedStart: string;
  testStatus: {
    theory: TestStatus;
    road: TestStatus;
    medical: TestStatus;
  };
  formatDate: (dateString: string) => string;
}

export const DocumentInfo = memo(function DocumentInfo({ 
  visaNumber, 
  licenseNumber, 
  joinDate, 
  expectedStart, 
  testStatus,
  formatDate 
}: DocumentInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-500" />
          Document Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <div className="text-sm text-muted-foreground">Visa Number</div>
            <div className="font-medium">{visaNumber}</div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground">License Number</div>
            <div className="font-medium">{licenseNumber}</div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground">Application Date</div>
            <div className="font-medium">{formatDate(joinDate)}</div>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground">Expected Start</div>
            <div className="font-medium">{formatDate(expectedStart)}</div>
          </div>
        </div>
        
        <div className="mt-6">
          <h3 className="font-medium mb-3">Test Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border rounded-md p-3">
              <div className="text-sm font-medium mb-2">Theory Test</div>
              <div className={`text-sm rounded-full px-3 py-1 inline-block ${
                testStatus.theory === "Pass" 
                  ? "bg-green-100 text-green-800" 
                  : testStatus.theory === "Fail"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}>
                {testStatus.theory}
              </div>
            </div>
            
            <div className="border rounded-md p-3">
              <div className="text-sm font-medium mb-2">Road Test</div>
              <div className={`text-sm rounded-full px-3 py-1 inline-block ${
                testStatus.road === "Pass" 
                  ? "bg-green-100 text-green-800" 
                  : testStatus.road === "Fail"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}>
                {testStatus.road}
              </div>
            </div>
            
            <div className="border rounded-md p-3">
              <div className="text-sm font-medium mb-2">Medical Exam</div>
              <div className={`text-sm rounded-full px-3 py-1 inline-block ${
                testStatus.medical === "Pass" 
                  ? "bg-green-100 text-green-800" 
                  : testStatus.medical === "Fail"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}>
                {testStatus.medical}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
