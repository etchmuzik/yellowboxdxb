
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function NotFoundCard() {
  const navigate = useNavigate();
  
  return (
    <div className="p-6">
      <Button
        variant="outline"
        className="mb-4"
        onClick={() => navigate("/riders")}
      >
        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Riders
      </Button>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <h2 className="text-2xl font-medium mb-2">Rider not found</h2>
            <p className="text-muted-foreground">
              The rider you're looking for doesn't exist or has been removed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
