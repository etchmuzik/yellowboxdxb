
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SidebarGroupProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function SidebarGroup({ title, children, defaultOpen = false }: SidebarGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-800">
        <span>{title}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "transform rotate-180" : "")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1 pt-1 pb-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
