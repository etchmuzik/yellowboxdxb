
import React, { useState } from "react";
import { RiderDocument, DocumentType } from "@/types";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Calendar, AlertCircle } from "lucide-react";
import { DocumentUploadDialog } from "./DocumentUploadDialog";
import { DocumentPreviewDialog } from "./DocumentPreviewDialog";
import { format } from "date-fns";

interface DocumentListProps {
  documents: RiderDocument[];
  riderId: string;
  requiredDocuments: DocumentType[];
  onDocumentsChange: () => void;
}

export const DocumentList = ({ 
  documents, 
  riderId, 
  requiredDocuments,
  onDocumentsChange 
}: DocumentListProps) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<RiderDocument | null>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);

  const getDocumentByType = (type: DocumentType) => {
    return documents.find(doc => doc.type === type);
  };

  const getStatusClass = (status: string) => {
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

  const handleOpenUpload = (docType: DocumentType) => {
    setSelectedDocType(docType);
    setUploadDialogOpen(true);
  };

  const handleOpenPreview = (doc: RiderDocument) => {
    setSelectedDocument(doc);
    setPreviewDialogOpen(true);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return format(new Date(dateString), "MMM d, yyyy");
  };

  const isExpiringSoon = (expiryDateString?: string) => {
    if (!expiryDateString) return false;
    const expiryDate = new Date(expiryDateString);
    const now = new Date();
    const diffDays = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-lg">Required Documents</h3>
        <Button onClick={() => setUploadDialogOpen(true)} size="sm">
          <Upload className="mr-1 h-4 w-4" />
          Upload New Document
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {requiredDocuments.map((docType) => {
          const doc = getDocumentByType(docType);
          const isExpiring = doc?.expiryDate && isExpiringSoon(doc.expiryDate);
          
          return (
            <div 
              key={docType}
              className="flex items-center justify-between border rounded-md p-3 hover:bg-slate-50"
              onClick={() => doc && handleOpenPreview(doc)}
              style={{ cursor: doc ? 'pointer' : 'default' }}
            >
              <div className="flex items-center gap-2">
                <FileText className={`h-5 w-5 ${doc ? 'text-blue-500' : 'text-gray-400'}`} />
                <div>
                  <div className="font-medium">{docType}</div>
                  {doc?.expiryDate && (
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Expires: {formatDate(doc.expiryDate)}
                      {isExpiring && (
                        <span className="ml-2 flex items-center text-amber-600">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Expiring soon
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {doc ? (
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(doc.status)}`}>
                    {doc.status}
                  </span>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenUpload(docType);
                    }}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Upload
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {documents.filter(doc => !requiredDocuments.includes(doc.type as DocumentType)).length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-md mb-2">Additional Documents</h4>
            {documents
              .filter(doc => !requiredDocuments.includes(doc.type as DocumentType))
              .map(doc => (
                <div 
                  key={doc.id}
                  className="flex items-center justify-between border rounded-md p-3 hover:bg-slate-50 mb-2"
                  onClick={() => handleOpenPreview(doc)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">{doc.type}</div>
                      {doc.expiryDate && (
                        <div className="text-sm text-muted-foreground">
                          Expires: {formatDate(doc.expiryDate)}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusClass(doc.status)}`}>
                    {doc.status}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      <DocumentUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        riderId={riderId}
        onSuccess={onDocumentsChange}
      />

      <DocumentPreviewDialog
        document={selectedDocument}
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        onDocumentUpdate={onDocumentsChange}
      />
    </div>
  );
};
