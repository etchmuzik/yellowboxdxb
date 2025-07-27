
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  CreditCard,
  Clock,
  Bell,
  Navigation,
  Home,
  Bike,
  User,
  Receipt
} from "lucide-react";
import { SidebarNavItem } from "./sidebar/SidebarNavItem";
import { SidebarGroup } from "./sidebar/SidebarGroup";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { SidebarFooter } from "./sidebar/SidebarFooter";
import { useAuth } from "@/hooks/use-auth";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobile: boolean;
}

export function Sidebar({ isOpen, setIsOpen, isMobile }: SidebarProps) {
  const location = useLocation();
  const { isAdmin, isOperations, isFinance, isRider } = useAuth();
  
  // Close sidebar when clicking outside on mobile
  const handleClose = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  // Check which section is active
  const isTrackingActive = location.pathname.includes('bike-tracker');
  const isManagementActive = location.pathname.includes('riders') || location.pathname.includes('expenses');
  const isReportingActive = location.pathname.includes('reports') || location.pathname.includes('activity');
  const isProfileActive = location.pathname.includes('profile');

  return (
    <>
      {/* Backdrop for mobile sidebar */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />
      )}

      <aside
        className={cn(
          "bg-yellowbox-dark text-white z-50 flex flex-col w-64 transition-all duration-300 ease-in-out shadow-lg",
          isMobile
            ? isOpen
              ? "fixed inset-y-0 left-0"
              : "fixed inset-y-0 -left-64"
            : "relative"
        )}
      >
        {/* Sidebar Header */}
        <SidebarHeader 
          onClose={() => setIsOpen(false)}
          showCloseButton={isMobile}
        />

        {/* Sidebar Content */}
        <div className="flex-1 py-4 px-3 flex flex-col gap-4 overflow-auto">
          {/* Dashboard - All users see this, but different content based on role */}
          <SidebarNavItem to="/" icon={Home} label="Dashboard" end />
          
          {/* Tracking - Admins, Operations, and Riders can see this */}
          {(isAdmin() || isOperations() || isRider()) && (
            <SidebarGroup title="Tracking" defaultOpen={isTrackingActive}>
              <SidebarNavItem to="/bike-tracker" icon={Navigation} label="Bike Tracker" />
              
              {/* Only rider sees their own profile */}
              {isRider() && (
                <SidebarNavItem to="/profile" icon={User} label="My Profile" />
              )}
            </SidebarGroup>
          )}
          
          {/* Management - Finance users now have access to riders for visa status monitoring */}
          {(isAdmin() || isOperations() || isFinance()) && (
            <SidebarGroup title="Management" defaultOpen={isManagementActive}>
              {(isAdmin() || isOperations() || isFinance()) && (
                <SidebarNavItem to="/riders" icon={Users} label="Riders" />
              )}
              {(isAdmin() || isFinance()) && (
                <SidebarNavItem to="/expenses" icon={CreditCard} label="Expenses" />
              )}
              {isFinance() && (
                <SidebarNavItem to="/visas" icon={Receipt} label="Visa Costs" />
              )}
            </SidebarGroup>
          )}
          
          {/* Reports & Notifications */}
          {(isAdmin() || isOperations() || isFinance()) && (
            <SidebarGroup title="Reports & Notifications" defaultOpen={isReportingActive}>
              <SidebarNavItem to="/reports" icon={FileText} label="Reports" />
              {(isAdmin() || isOperations()) && (
                <SidebarNavItem to="/activity" icon={Clock} label="Activity Log" />
              )}
              <SidebarNavItem to="/notifications" icon={Bell} label="Notifications" />
            </SidebarGroup>
          )}
          
          <div className="mt-auto pt-4">
            <SidebarNavItem to="/settings" icon={Settings} label="Settings" />
          </div>
        </div>

        {/* Sidebar Footer */}
        <SidebarFooter />
      </aside>
    </>
  );
}
