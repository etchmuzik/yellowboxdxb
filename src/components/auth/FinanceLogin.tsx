
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./LoginForm";

export const FinanceLogin = () => {
  return (
    <Card className="premium-card border-t-4 border-t-green-500">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Finance Sign In</CardTitle>
        <CardDescription>
          Finance team login for budget management and expense approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm loginType="finance" />
      </CardContent>
    </Card>
  );
};
