
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignUpForm } from "./SignUpForm";

interface StaffSignUpProps {
  onCancel?: () => void;
}

export const StaffSignUp = ({ onCancel }: StaffSignUpProps) => {
  return (
    <Card className="premium-card border-t-4 border-t-amber-500">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Staff Registration</CardTitle>
        <CardDescription>
          Create a new Admin or Operations account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm signUpType="staff" onCancel={onCancel} />
      </CardContent>
    </Card>
  );
};
