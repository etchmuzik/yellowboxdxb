import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Bike, Calendar, FileCheck, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Rider } from "@/types";
import { RiderSettingsForm } from "./rider/RiderSettingsForm";
import { MyBikeLocationCard } from "./rider/MyBikeLocationCard";
import { DocumentStatusCard } from "./rider/DocumentStatusCard";
import { RecentDeliveries } from "./rider/RecentDeliveries";

export function RiderDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Mock data for demonstration - in a real app, this would come from an API
  const riderData: Rider = {
    id: "R001",
    fullName: currentUser?.name || "Rider User",
    nationality: "UAE",
    phone: "+971 50 123 4567",
    email: currentUser?.email || "",
    bikeType: "Delivery Motorcycle",
    visaNumber: "UAE-987654321",
    applicationStage: "Theory Test",
    testStatus: {
      theory: "Pending",
      road: "Pending",
      medical: "Pending"
    },
    joinDate: new Date().toISOString(),
    expectedStart: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Needs to complete theory test within 2 weeks."
  };

  // Calculate application progress
  const stages = ["Applied", "Docs Verified", "Theory Test", "Road Test", "Medical", "ID Issued", "Active"];
  const currentStageIndex = stages.indexOf(riderData.applicationStage);
  const progress = Math.round(((currentStageIndex + 1) / stages.length) * 100);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Welcome, {riderData.fullName}</h1>
        <p className="text-muted-foreground">
          Your personal dashboard with all your information in one place
        </p>
      </div>

      {/* Application Progress Card */}
      <Card className="border-t-2 border-t-yellowbox-yellow shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-yellowbox-yellow" />
            Application Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Status: <span className="font-semibold">{riderData.applicationStage}</span></span>
              <span className="font-semibold">{progress}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-2 mt-4">
              {stages.map((stage, index) => (
                <div 
                  key={stage}
                  className={`p-2 rounded-md border text-center ${
                    index < currentStageIndex 
                      ? "border-green-200 bg-green-50 text-green-700" 
                      : index === currentStageIndex
                        ? "border-yellowbox-yellow bg-yellowbox-yellow/10 text-yellowbox-yellow"
                        : "border-gray-200 bg-gray-50 text-gray-400"
                  }`}
                >
                  <div className="text-sm font-medium">{stage}</div>
                  <div className="text-xs mt-1">
                    {index < currentStageIndex ? "Completed" : 
                     index === currentStageIndex ? "Current" : "Upcoming"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <MyBikeLocationCard />
        <RiderSettingsForm />

        {/* Right column */}
        <DocumentStatusCard />
        <RecentDeliveries />
      </div>

      {/* Test Status - we'll keep this section but make it more compact */}
      <Card className="border-t-2 border-t-yellowbox-yellow shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-yellowbox-yellow" />
            Test Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="border rounded-md p-4">
              <div className="text-sm font-semibold mb-2">Theory Test</div>
              <div className={`text-sm rounded-full px-3 py-1 inline-block ${
                riderData.testStatus.theory === "Pass" 
                  ? "bg-green-100 text-green-800" 
                  : riderData.testStatus.theory === "Fail"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}>
                {riderData.testStatus.theory}
              </div>
              {riderData.testStatus.theory === "Pending" && (
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Schedule Test
                </Button>
              )}
            </div>
            
            <div className="border rounded-md p-4">
              <div className="text-sm font-semibold mb-2">Road Test</div>
              <div className={`text-sm rounded-full px-3 py-1 inline-block ${
                riderData.testStatus.road === "Pass" 
                  ? "bg-green-100 text-green-800" 
                  : riderData.testStatus.road === "Fail"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}>
                {riderData.testStatus.road}
              </div>
              {riderData.applicationStage === "Road Test" && riderData.testStatus.road === "Pending" && (
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Schedule Test
                </Button>
              )}
            </div>
            
            <div className="border rounded-md p-4">
              <div className="text-sm font-semibold mb-2">Medical Exam</div>
              <div className={`text-sm rounded-full px-3 py-1 inline-block ${
                riderData.testStatus.medical === "Pass" 
                  ? "bg-green-100 text-green-800" 
                  : riderData.testStatus.medical === "Fail"
                    ? "bg-red-100 text-red-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}>
                {riderData.testStatus.medical}
              </div>
              {riderData.applicationStage === "Medical" && riderData.testStatus.medical === "Pending" && (
                <Button variant="outline" size="sm" className="w-full mt-3">
                  Schedule Exam
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => navigate("/bike-tracker")} className="bg-yellowbox-yellow hover:bg-yellowbox-yellow/90">
          <Bike className="mr-2 h-4 w-4" />
          View Bike Tracker
        </Button>
        <Button variant="outline" onClick={() => navigate("/profile")}>
          View Full Profile
        </Button>
      </div>
    </div>
  );
}
