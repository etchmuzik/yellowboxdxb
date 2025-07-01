
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center space-y-5">
        <div className="h-24 w-24 bg-nike-red/10 rounded-full flex items-center justify-center mx-auto">
          <span className="text-5xl font-bold text-nike-red">404</span>
        </div>
        
        <h1 className="text-2xl font-bold">Page not found</h1>
        
        <p className="text-muted-foreground max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="pt-4">
          <Button 
            onClick={() => navigate("/")}
            className="bg-nike-red hover:bg-nike-red/90"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
