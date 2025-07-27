
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignUpForm } from "./SignUpForm";

interface FinanceSignUpProps {
  onCancel?: () => void;
}

export const FinanceSignUp = ({ onCancel }: FinanceSignUpProps) => {
  return (
    <Card className="premium-card border-t-4 border-t-green-500">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Finance Registration</CardTitle>
        <CardDescription>
          Create a new Finance team account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm signUpType="finance" onCancel={onCancel} />
      </CardContent>
    </Card>
  );
};
