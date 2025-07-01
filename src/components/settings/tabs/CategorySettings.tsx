
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

// Categories storage key
const CATEGORIES_KEY = "nike-rider-expense-categories";

export function CategorySettings() {
  const [categories, setCategories] = useState([
    "Visa Fees",
    "RTA Tests",
    "Medical",
    "Residency ID",
    "Training",
    "Uniform",
    "Other"
  ]);
  const [newCategory, setNewCategory] = useState("");

  // Load saved categories on mount
  useEffect(() => {
    try {
      const savedCategories = localStorage.getItem(CATEGORIES_KEY);
      if (savedCategories) {
        setCategories(JSON.parse(savedCategories));
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  }, []);

  const addCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory("");
    }
  };

  const removeCategory = (categoryToRemove: string) => {
    setCategories(categories.filter(category => category !== categoryToRemove));
  };

  const saveCategorySettings = () => {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    
    toast({
      title: "Categories Saved",
      description: `${categories.length} expense categories have been saved.`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Categories</CardTitle>
        <CardDescription>
          Manage expense categories for better organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex space-x-2">
          <Input
            placeholder="New category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1"
          />
          <Button onClick={addCategory}>Add</Button>
        </div>
        
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center justify-between p-2 border rounded-md">
              <span>{category}</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => removeCategory(category)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        
        <Button 
          className="w-full sm:w-auto"
          onClick={saveCategorySettings}
        >
          Save Categories
        </Button>
      </CardContent>
    </Card>
  );
}
