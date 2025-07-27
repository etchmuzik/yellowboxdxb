import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RiderDocument } from '@/types';
import { Upload, Eye, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface DocumentUploadCardProps {
  documentType: string;
  riderId: string;
  currentDocument?: RiderDocument;
}

export function DocumentUploadCard({ 
  documentType, 
  riderId, 
  currentDocument 
}: DocumentUploadCardProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Valid':
        return 'default';
      case 'Expired':
        return 'destructive';
      case 'Pending':
        return 'secondary';
      case 'Rejected':
        return 'destructive';
      case 'Required':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleUpload = () => {
    // TODO: Implement file upload
  };

  const handleView = () => {
    if (currentDocument?.fileUrl) {
      window.open(currentDocument.fileUrl, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{documentType}</CardTitle>
          {currentDocument && (
            <Badge variant={getStatusColor(currentDocument.status)}>
              {currentDocument.status}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {currentDocument ? (
          <div className="space-y-3">
            <div className="text-sm space-y-1">
              <p className="text-muted-foreground">
                Uploaded: {format(new Date(currentDocument.uploadDate), 'dd MMM yyyy')}
              </p>
              {currentDocument.expiryDate && (
                <p className="text-muted-foreground">
                  Expires: {format(new Date(currentDocument.expiryDate), 'dd MMM yyyy')}
                </p>
              )}
            </div>
            
            {currentDocument.status === 'Expired' && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-600">
                  This document has expired. Please upload a new one.
                </p>
              </div>
            )}

            {currentDocument.notes && (
              <p className="text-sm text-muted-foreground italic">
                {currentDocument.notes}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleView}
                disabled={!currentDocument.fileUrl}
              >
                <Eye className="mr-2 h-4 w-4" />
                View
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleUpload}
              >
                <Upload className="mr-2 h-4 w-4" />
                Replace
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-3">
              No document uploaded yet
            </p>
            <Button onClick={handleUpload}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}