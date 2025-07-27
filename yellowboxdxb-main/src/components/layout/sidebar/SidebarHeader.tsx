
import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarHeaderProps {
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function SidebarHeader({ onClose, showCloseButton = false }: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between h-16 px-4 border-b border-white/30">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 bg-yellowbox-yellow rounded-md flex items-center justify-center text-black font-bold text-lg">
          YB
        </div>
        <h1 className="font-bold text-lg text-white">Yellow Box</h1>
      </div>
      
      {showCloseButton && onClose && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-white bg-slate-700"
        >
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
