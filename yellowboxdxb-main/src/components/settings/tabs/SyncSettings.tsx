
import { useState, useRef } from "react";
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
import { exportSettings, importSettings } from "@/utils/settingsSync";
import { Download, Upload } from "lucide-react";

export function SyncSettings() {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    try {
      exportSettings();
      toast({
        title: "Settings Exported",
        description: "Your settings have been exported successfully.",
      });
    } catch (error) {
      console.error("Error exporting settings:", error);
      toast({
        title: "Export Failed",
        description: "There was a problem exporting your settings.",
        variant: "destructive",
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      const success = await importSettings(file);
      if (success) {
        toast({
          title: "Settings Imported",
          description: "Your settings have been imported successfully. Please refresh the page to see the changes.",
        });
      } else {
        throw new Error("Failed to import settings");
      }
    } catch (error) {
      console.error("Error importing settings:", error);
      toast({
        title: "Import Failed",
        description: "There was a problem importing your settings. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings Sync</CardTitle>
        <CardDescription>
          Export or import your settings configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Export Settings</h3>
          <p className="text-sm text-muted-foreground">
            Download all your current settings as a JSON file for backup or transfer to another device.
          </p>
          <Button 
            onClick={handleExport}
            className="w-full sm:w-auto"
          >
            <Download className="mr-2" />
            Export Settings
          </Button>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Import Settings</h3>
          <p className="text-sm text-muted-foreground">
            Import previously exported settings. This will override your current settings.
          </p>
          <Button 
            onClick={handleImportClick}
            className="w-full sm:w-auto"
            disabled={isImporting}
          >
            <Upload className="mr-2" />
            {isImporting ? "Importing..." : "Import Settings"}
          </Button>
          <Input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
}
