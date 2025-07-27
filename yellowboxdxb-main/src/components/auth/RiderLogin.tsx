
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./LoginForm";

export const RiderLogin = () => {
  return (
    <Card className="premium-card border-t-4 border-t-yellowbox-yellow">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Rider Sign In</CardTitle>
        <CardDescription>
          Delivery drivers login here to track your onboarding process
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm loginType="rider" />
      </CardContent>
    </Card>
  );
};
