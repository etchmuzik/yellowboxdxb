
import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SidebarNavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  end?: boolean;
}

export function SidebarNavItem({ to, icon: Icon, label, end = false }: SidebarNavItemProps) {
  const location = useLocation();
  const isActive = end ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <NavLink
      to={to}
      end={end}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-bold transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-yellowbox-yellow to-amber-500 text-nike-dark font-semibold shadow-md"
          : "text-slate-200 bg-slate-700/80 hover:bg-slate-600 hover:translate-x-1"
      )}
    >
      <div className={`flex items-center justify-center ${isActive ? "text-nike-dark" : "text-yellowbox-yellow"}`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="flex-1">{label}</span>
      {isActive && (
        <div className="h-1.5 w-1.5 rounded-full bg-nike-dark animate-pulse"></div>
      )}
    </NavLink>
  );
}
