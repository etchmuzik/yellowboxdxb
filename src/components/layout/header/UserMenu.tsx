
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

// Helper function to get initials from name
const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

export function UserMenu() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  return (
    <div className="ml-2 border-l pl-2 hidden sm:block">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2">
            <div className="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center">
              <span className="font-bold text-nike-dark">
                {currentUser ? getInitials(currentUser.name) : "?"}
              </span>
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-medium">{currentUser?.name || "Guest"}</div>
              <div className="text-xs opacity-60">{currentUser?.email || ""}</div>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {currentUser?.role === "Rider-Applicant" && (
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              My Profile
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => navigate("/settings")}>
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogout}>
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
