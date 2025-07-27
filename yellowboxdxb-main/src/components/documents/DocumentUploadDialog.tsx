
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DocumentUploadForm } from "./DocumentUploadForm";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  riderId: string;
  onSuccess?: () => void;
}

export const DocumentUploadDialog = ({
  open,
  onOpenChange,
  riderId,
  onSuccess,
}: DocumentUploadDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a new document to your profile. Supported formats: PDF, JPEG, PNG.
          </DialogDescription>
        </DialogHeader>
        <DocumentUploadForm
          riderId={riderId}
          onSuccess={onSuccess}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
};
