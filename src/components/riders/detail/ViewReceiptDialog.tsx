
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

interface ViewReceiptDialogProps {
  open: boolean;
  onClose: () => void;
  onOpenChange?: (open: boolean) => void; // Added this optional prop
  receiptUrl?: string;
  title: string;
}

export function ViewReceiptDialog({
  open,
  onClose,
  onOpenChange,
  receiptUrl,
  title,
}: ViewReceiptDialogProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Determine if the file is a PDF based on the URL
  const isPdf = receiptUrl?.toLowerCase().endsWith(".pdf");

  const handleDownload = () => {
    if (receiptUrl) {
      window.open(receiptUrl, "_blank");
    }
  };

  // Use onOpenChange if provided, otherwise use onClose
  const handleOpenChange = (isOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(isOpen);
    } else if (!isOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto my-4">
          {!receiptUrl ? (
            <div className="flex flex-col items-center justify-center h-[300px] bg-muted/50 rounded-md">
              <FileText className="h-12 w-12 text-muted-foreground/60 mb-2" />
              <p className="text-muted-foreground">No receipt available</p>
            </div>
          ) : isPdf ? (
            <div className="relative h-[400px] border rounded">
              <object
                data={receiptUrl}
                type="application/pdf"
                className="w-full h-full"
                onLoad={() => setIsLoading(false)}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <FileText className="h-12 w-12 text-muted-foreground/60 mb-2" />
                  <p className="text-muted-foreground">
                    PDF cannot be displayed. Please download to view.
                  </p>
                </div>
              </object>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-nike-red"></div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative border rounded flex items-center justify-center min-h-[300px]">
              <img
                src={receiptUrl}
                alt="Receipt"
                className="max-w-full max-h-[400px] object-contain"
                onLoad={() => setIsLoading(false)}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-nike-red"></div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose} className="mr-2">
            Close
          </Button>
          {receiptUrl && (
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
