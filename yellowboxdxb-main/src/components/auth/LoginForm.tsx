
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface LoginFormProps {
  loginType: "staff" | "rider" | "finance";
}

export const LoginForm = ({ loginType }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Missing information", {
        description: "Please enter both email and password",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        toast.success("Welcome back!", {
          description: "Successfully logged in to Yellow Box",
        });
      }
      // Auth hook will handle navigation once authenticated
    } catch (error) {
      const err = error as { message?: string };
      toast.error("Login failed", {
        description: err.message || "Invalid email or password",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get placeholder and styling based on login type
  const getLoginTypeSpecifics = () => {
    switch (loginType) {
      case "finance":
        return {
          emailPlaceholder: "finance@yellowboxdxb.com",
          buttonClasses: "from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
        };
      case "rider":
        return {
          emailPlaceholder: "rider@yellowboxdxb.com",
          buttonClasses: "from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600"
        };
      case "staff":
      default:
        return {
          emailPlaceholder: "admin@yellowboxdxb.com",
          buttonClasses: "from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
        };
    }
  };

  const { emailPlaceholder, buttonClasses } = getLoginTypeSpecifics();
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor={`${loginType}-email`} className="text-sm font-medium">
          Email
        </label>
        <Input
          id={`${loginType}-email`}
          type="email"
          placeholder={emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="premium-input"
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor={`${loginType}-password`} className="text-sm font-medium">
          Password
        </label>
        <Input
          id={`${loginType}-password`}
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="premium-input"
          required
        />
      </div>
      <Button 
        type="submit" 
        className={`w-full bg-gradient-to-r ${buttonClasses} text-white font-medium shadow-md`} 
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
          </>
        ) : "Sign In"}
      </Button>
    </form>
  );
};
