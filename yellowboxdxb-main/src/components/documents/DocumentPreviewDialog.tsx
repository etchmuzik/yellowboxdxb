
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RiderDocument, DocumentStatus } from "@/types";
import { updateDocumentStatus, deleteDocument } from "@/services/documentService";
import { FileText, ExternalLink, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

interface DocumentPreviewDialogProps {
  document: RiderDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentUpdate?: () => void;
}

export const DocumentPreviewDialog = ({
  document,
  open,
  onOpenChange,
  onDocumentUpdate,
}: DocumentPreviewDialogProps) => {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<DocumentStatus | undefined>(document?.status);
  const [notes, setNotes] = useState(document?.notes || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isStaffUser = currentUser?.role === 'Admin' || currentUser?.role === 'Operations';

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not specified";
    return format(new Date(dateString), "PPP");
  };

  const getStatusColor = (status?: DocumentStatus) => {
    switch (status) {
      case "Valid":
        return "bg-green-100 text-green-800";
      case "Expired":
        return "bg-red-100 text-red-800";
      case "Required":
        return "bg-yellow-100 text-yellow-800";
      case "Pending":
        return "bg-blue-100 text-blue-800";
      case "Rejected":
        return "bg-rose-100 text-rose-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusUpdate = async () => {
    if (!document || !status) return;
    
    setIsUpdating(true);
    try {
      const success = await updateDocumentStatus(document.id, status, notes);
      if (success) {
        toast.success("Document status updated successfully");
        if (onDocumentUpdate) onDocumentUpdate();
        onOpenChange(false);
      } else {
        toast.error("Failed to update document status");
      }
    } catch (error) {
      console.error("Error updating document status:", error);
      toast.error("An error occurred while updating document status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!document) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteDocument(document.id, document.fileUrl);
      if (success) {
        toast.success("Document deleted successfully");
        if (onDocumentUpdate) onDocumentUpdate();
        onOpenChange(false);
      } else {
        toast.error("Failed to delete document");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("An error occurred while deleting the document");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {document.type}
          </DialogTitle>
          <DialogDescription>
            Document details and preview
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">File Name</p>
              <p>{document.fileName.split('_').pop()}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge className={getStatusColor(document.status)}>
                {document.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Upload Date</p>
              <p>{formatDate(document.uploadDate)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Expiry Date</p>
              <p>{formatDate(document.expiryDate)}</p>
            </div>
          </div>

          {document.fileUrl && (
            <div className="flex items-center justify-center">
              {document.fileUrl.toLowerCase().endsWith('.pdf') ? (
                <div className="bg-slate-100 p-6 rounded-lg flex flex-col items-center">
                  <FileText className="h-16 w-16 text-slate-500" />
                  <a 
                    href={document.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="mt-2 flex items-center text-blue-500 hover:underline"
                  >
                    View PDF <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </div>
              ) : (
                <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                  <img 
                    src={document.fileUrl} 
                    alt={document.type} 
                    className="w-full h-full object-contain" 
                  />
                  <a 
                    href={document.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="absolute bottom-2 right-2 bg-white bg-opacity-75 rounded-full p-1"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {isStaffUser && (
            <>
              <div className="space-y-2">
                <Label htmlFor="status">Update Status</Label>
                <Select 
                  value={status} 
                  onValueChange={(value) => setStatus(value as DocumentStatus)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Valid">Valid</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                    <SelectItem value="Required">Required</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes"
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this document"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div>
            {isStaffUser && (
              <Button 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={isDeleting || isUpdating}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            {isStaffUser && (
              <Button 
                onClick={handleStatusUpdate}
                disabled={isUpdating || status === document.status}
              >
                {isUpdating ? "Updating..." : "Update"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
