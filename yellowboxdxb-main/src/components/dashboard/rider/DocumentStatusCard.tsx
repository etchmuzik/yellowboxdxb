
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileCheck, Upload, AlertCircle, Loader2 } from "lucide-react";
import { DocumentUploadDialog } from "@/components/documents/DocumentUploadDialog";
import { getDocumentsByRiderId, getRequiredDocuments } from "@/services/documentService";
import { RiderDocument, DocumentType } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { DocumentList } from "@/components/documents/DocumentList";
import { toast } from "sonner";

export function DocumentStatusCard() {
  const { currentUser } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [documents, setDocuments] = useState<RiderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Mock rider data - in a real app this would come from an API or context
  const mockRiderId = currentUser?.id || "R001";
  const mockApplicationStage = "Theory Test";
  
  // Get required documents based on application stage
  const requiredDocuments = getRequiredDocuments(mockApplicationStage);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        const docs = await getDocumentsByRiderId(mockRiderId);
        setDocuments(docs);
      } catch (error) {
        console.error("Error fetching rider documents:", error);
        setError("Failed to load documents. Please try again.");
        toast.error("Failed to load documents");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, [mockRiderId]);

  const handleDocumentsChange = () => {
    // Reload documents after changes
    const fetchDocuments = async () => {
      try {
        const docs = await getDocumentsByRiderId(mockRiderId);
        setDocuments(docs);
        toast.success("Documents updated successfully");
      } catch (error) {
        console.error("Error fetching rider documents:", error);
        toast.error("Failed to refresh documents");
      }
    };
    
    fetchDocuments();
  };

  const getCompletionStats = () => {
    const totalRequired = requiredDocuments.length;
    const completed = requiredDocuments.filter(docType => 
      documents.some(doc => doc.type === docType && doc.status === 'Valid')
    ).length;
    return { completed, total: totalRequired, percentage: Math.round((completed / totalRequired) * 100) };
  };

  const stats = getCompletionStats();

  return (
    <Card className="shadow-md border-t-2 border-t-green-500">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-green-500" />
            Document Status
          </div>
          <div className="text-sm font-normal text-muted-foreground">
            {stats.completed}/{stats.total} completed ({stats.percentage}%)
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading documents...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-center">
            <div className="space-y-3">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <DocumentList
            documents={documents}
            riderId={mockRiderId}
            requiredDocuments={requiredDocuments}
            onDocumentsChange={handleDocumentsChange}
          />
        )}
      </CardContent>
    </Card>
  );
}
