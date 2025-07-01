
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignUpForm } from "./SignUpForm";

interface RiderSignUpProps {
  onCancel?: () => void;
}

export const RiderSignUp = ({ onCancel }: RiderSignUpProps) => {
  return (
    <Card className="premium-card border-t-4 border-t-yellowbox-yellow">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Rider Registration</CardTitle>
        <CardDescription>
          Create a new account to start your onboarding process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm signUpType="rider" onCancel={onCancel} />
      </CardContent>
    </Card>
  );
};
