
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface SignUpFormProps {
  signUpType: "staff" | "rider" | "finance";
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const SignUpForm = ({ signUpType, onSuccess, onCancel }: SignUpFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      // Determine the role based on signUpType
      const role = signUpType === "staff" 
        ? "Admin" 
        : signUpType === "finance" 
          ? "Finance" 
          : "Rider-Applicant";
      
      const success = await register(name, email, password, role);
      
      if (success) {
        toast({
          title: "Account created",
          description: "Your account has been created successfully",
        });
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      const err = error as { message?: string };
      toast({
        title: "Registration failed",
        description: err.message || "Could not create your account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get placeholder and styling based on signup type
  const getSignUpTypeSpecifics = () => {
    switch (signUpType) {
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

  const { emailPlaceholder, buttonClasses } = getSignUpTypeSpecifics();
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor={`${signUpType}-name`} className="text-sm font-medium">
          Full Name
        </label>
        <Input
          id={`${signUpType}-name`}
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="premium-input"
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor={`${signUpType}-email`} className="text-sm font-medium">
          Email
        </label>
        <Input
          id={`${signUpType}-email`}
          type="email"
          placeholder={emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="premium-input"
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor={`${signUpType}-password`} className="text-sm font-medium">
          Password
        </label>
        <Input
          id={`${signUpType}-password`}
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="premium-input"
          required
          minLength={6}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor={`${signUpType}-confirm-password`} className="text-sm font-medium">
          Confirm Password
        </label>
        <Input
          id={`${signUpType}-confirm-password`}
          type="password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="premium-input"
          required
        />
      </div>
      <div className="flex space-x-2">
        <Button 
          type="submit" 
          className={`flex-1 bg-gradient-to-r ${buttonClasses} text-white font-medium shadow-md`} 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
            </>
          ) : "Sign Up"}
        </Button>
        {onCancel && (
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};
