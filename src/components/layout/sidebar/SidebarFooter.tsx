
import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function SidebarFooter() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="border-t border-white/30 p-3">
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-bold text-white bg-slate-700 hover:bg-slate-600 transition-colors"
      >
        <LogOut className="h-5 w-5" />
        <span>Log out</span>
      </button>
    </div>
  );
}
