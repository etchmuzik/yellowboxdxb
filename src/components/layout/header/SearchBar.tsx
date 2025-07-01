
import React, { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";

interface SearchBarProps {
  isMobile: boolean;
}

export function SearchBar({ isMobile }: SearchBarProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      toast({
        title: "Search submitted",
        description: `You searched for: ${searchQuery}`,
      });
    }
  };

  if (isMobile) {
    return (
      <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-screen p-2" align="start">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Search..."
              className="flex-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <Button type="submit">Search</Button>
          </form>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <form onSubmit={handleSearch} className="relative w-64">
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search..."
        className="w-full pl-8"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </form>
  );
}
