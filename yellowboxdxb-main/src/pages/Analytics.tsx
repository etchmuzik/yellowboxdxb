import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Package, DollarSign } from "lucide-react";

export default function Analytics() {
  const stats = [
    {
      title: "Total Riders",
      value: "125",
      description: "+12 from last month",
      icon: Users,
      trend: "+10.5%"
    },
    {
      title: "Active Deliveries",
      value: "3,456",
      description: "Daily average",
      icon: Package,
      trend: "+22.3%"
    },
    {
      title: "Revenue",
      value: "AED 245,678",
      description: "This month",
      icon: DollarSign,
      trend: "+15.7%"
    },
    {
      title: "Growth Rate",
      value: "18.2%",
      description: "Month over month",
      icon: TrendingUp,
      trend: "+3.4%"
    }
  ];

  return (
    <Layout>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Business insights and performance metrics</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
                <div className="flex items-center pt-1">
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-xs text-green-600 font-medium">{stat.trend}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Analytics Dashboard</CardTitle>
            <CardDescription>Detailed analytics coming soon</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The analytics dashboard is currently under development. 
              Charts and detailed metrics will be available soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}