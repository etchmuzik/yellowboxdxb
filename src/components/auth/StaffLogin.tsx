
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./LoginForm";

export const StaffLogin = () => {
  return (
    <Card className="premium-card border-t-4 border-t-amber-500">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Staff Sign In</CardTitle>
        <CardDescription>
          Admin, Operations & Finance users login here
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm loginType="staff" />
      </CardContent>
    </Card>
  );
};
