
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetSettings } from "./tabs/BudgetSettings";
import { NotificationSettings } from "./tabs/NotificationSettings";
import { CategorySettings } from "./tabs/CategorySettings";
import { ApiSettings } from "./tabs/ApiSettings";
import { SyncSettings } from "./tabs/SyncSettings";
import { BikeSettings } from "./tabs/BikeSettings";
import { RiderSettings } from "./tabs/RiderSettings";
import { useAuth } from "@/hooks/use-auth";

export function SettingsContent() {
  const { isAdmin, isOperations, isFinance, isRider } = useAuth();

  // If rider, show limited settings (personal info and notifications only)
  if (isRider()) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">Settings</h1>
          <p className="text-muted-foreground">
            Manage your personal information and preferences
          </p>
        </div>

        <Tabs defaultValue="personal">
          <TabsList className="grid w-full md:w-auto grid-cols-2">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="space-y-6 mt-6">
            <RiderSettings />
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6 mt-6">
            <NotificationSettings />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Role-based access control for staff members
  const canAccessBudget = isAdmin() || isFinance(); // Only Admin and Finance
  const canAccessCategories = isAdmin(); // Only Admin can manage categories
  const canAccessBikes = isAdmin() || isOperations(); // Only Admin and Operations
  const canAccessApiKeys = isAdmin(); // Only Admin
  const canAccessSync = isAdmin(); // Only Admin

  const getTabsCount = () => {
    let count = 1; // notifications always available
    if (canAccessBudget) count++;
    if (canAccessCategories) count++;
    if (canAccessBikes) count++;
    if (canAccessApiKeys) count++;
    if (canAccessSync) count++;
    return count;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground">
          Configure application settings and preferences
        </p>
      </div>

      <Tabs defaultValue={canAccessBudget ? "budget" : "notifications"}>
        <TabsList className={`grid w-full md:w-auto grid-cols-${getTabsCount()}`}>
          {canAccessBudget && <TabsTrigger value="budget">Budget</TabsTrigger>}
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          {canAccessCategories && <TabsTrigger value="categories">Categories</TabsTrigger>}
          {canAccessBikes && <TabsTrigger value="bikes">Bikes</TabsTrigger>}
          {canAccessApiKeys && <TabsTrigger value="api">API Keys</TabsTrigger>}
          {canAccessSync && <TabsTrigger value="sync">Sync</TabsTrigger>}
        </TabsList>
        
        {canAccessBudget && (
          <TabsContent value="budget" className="space-y-6 mt-6">
            <BudgetSettings />
          </TabsContent>
        )}
        
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <NotificationSettings />
        </TabsContent>
        
        {canAccessCategories && (
          <TabsContent value="categories" className="space-y-6 mt-6">
            <CategorySettings />
          </TabsContent>
        )}
        
        {canAccessBikes && (
          <TabsContent value="bikes" className="space-y-6 mt-6">
            <BikeSettings />
          </TabsContent>
        )}
        
        {canAccessApiKeys && (
          <TabsContent value="api" className="space-y-6 mt-6">
            <ApiSettings />
          </TabsContent>
        )}
        
        {canAccessSync && (
          <TabsContent value="sync" className="space-y-6 mt-6">
            <SyncSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
