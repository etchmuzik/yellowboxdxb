
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, UserRound, Users, DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { LoginHeader, StaffLogin, RiderLogin, FinanceLogin } from "@/components/auth";
import { StaffSignUp } from "@/components/auth/StaffSignUp";
import { RiderSignUp } from "@/components/auth/RiderSignUp";
import { FinanceSignUp } from "@/components/auth/FinanceSignUp";
import { Button } from "@/components/ui/button";

const Login = () => {
  const [loginType, setLoginType] = useState<"staff" | "rider" | "finance">("staff");
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, from]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-yellow-500" />
      </div>
    );
  }

  const handleSwitchMode = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="absolute inset-0 opacity-10 dubai-skyline"></div>
      
      <div className="w-full max-w-md px-4 z-10">
        <LoginHeader />

        {isSignUp ? (
          <>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Create Account</h2>
              <Button variant="ghost" size="sm" onClick={handleSwitchMode}>
                Back to Login
              </Button>
            </div>
            
            <Tabs defaultValue={loginType} onValueChange={(value) => setLoginType(value as "staff" | "rider" | "finance")}>
              <TabsList className="grid grid-cols-3 mb-4 w-full">
                <TabsTrigger value="staff" className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>Staff</span>
                </TabsTrigger>
                <TabsTrigger value="rider" className="flex items-center gap-1.5">
                  <UserRound className="h-4 w-4" />
                  <span>Rider</span>
                </TabsTrigger>
                <TabsTrigger value="finance" className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" />
                  <span>Finance</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="staff">
                <StaffSignUp onCancel={handleSwitchMode} />
              </TabsContent>
              
              <TabsContent value="rider">
                <RiderSignUp onCancel={handleSwitchMode} />
              </TabsContent>
              
              <TabsContent value="finance">
                <FinanceSignUp onCancel={handleSwitchMode} />
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <>
            <Tabs defaultValue="staff" onValueChange={(value) => setLoginType(value as "staff" | "rider" | "finance")}>
              <TabsList className="grid grid-cols-3 mb-4 w-full">
                <TabsTrigger value="staff" className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>Staff Login</span>
                </TabsTrigger>
                <TabsTrigger value="rider" className="flex items-center gap-1.5">
                  <UserRound className="h-4 w-4" />
                  <span>Rider Login</span>
                </TabsTrigger>
                <TabsTrigger value="finance" className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4" />
                  <span>Finance Login</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="staff">
                <StaffLogin />
              </TabsContent>
              
              <TabsContent value="rider">
                <RiderLogin />
              </TabsContent>
              
              <TabsContent value="finance">
                <FinanceLogin />
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <button 
                  onClick={handleSwitchMode}
                  className="text-yellowbox-yellow hover:underline focus:outline-none"
                >
                  Sign up now
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
