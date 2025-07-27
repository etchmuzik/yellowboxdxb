import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Eye, FileText, Image, FileCheck } from "lucide-react";
import { formatDate } from "@/utils/dataUtils";

// Mock data for documents
const mockDocuments = [
  {
    id: "1",
    riderId: "rider-1",
    riderName: "Ahmed Hassan",
    type: "Emirates ID",
    fileName: "emirates_id_ahmed.pdf",
    uploadDate: new Date("2024-03-15"),
    status: "verified",
    size: "2.5 MB",
    fileType: "pdf"
  },
  {
    id: "2",
    riderId: "rider-1",
    riderName: "Ahmed Hassan",
    type: "Driving License",
    fileName: "driving_license_ahmed.pdf",
    uploadDate: new Date("2024-03-15"),
    status: "pending",
    size: "1.8 MB",
    fileType: "pdf"
  },
  {
    id: "3",
    riderId: "rider-2",
    riderName: "Mohammed Ali",
    type: "Passport",
    fileName: "passport_mohammed.jpg",
    uploadDate: new Date("2024-03-14"),
    status: "verified",
    size: "3.2 MB",
    fileType: "image"
  },
  {
    id: "4",
    riderId: "rider-2",
    riderName: "Mohammed Ali",
    type: "Visa",
    fileName: "visa_mohammed.pdf",
    uploadDate: new Date("2024-03-14"),
    status: "rejected",
    size: "1.5 MB",
    fileType: "pdf"
  }
];

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredDocuments = mockDocuments.filter(doc => {
    const matchesSearch = doc.riderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || doc.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; text: string }> = {
      verified: { color: "default", text: "Verified" },
      pending: { color: "secondary", text: "Pending" },
      rejected: { color: "destructive", text: "Rejected" }
    };
    
    const variant = variants[status] || variants.pending;
    
    return (
      <Badge variant={variant.color as any}>
        {variant.text}
      </Badge>
    );
  };

  const getFileIcon = (fileType: string) => {
    return fileType === "image" ? <Image className="h-4 w-4" /> : <FileText className="h-4 w-4" />;
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">Manage and verify rider documents</p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search Documents</CardTitle>
            <CardDescription>Search by rider name, document type, or filename</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filterStatus === "all" ? "default" : "outline"}
                  onClick={() => setFilterStatus("all")}
                >
                  All
                </Button>
                <Button
                  variant={filterStatus === "verified" ? "default" : "outline"}
                  onClick={() => setFilterStatus("verified")}
                >
                  Verified
                </Button>
                <Button
                  variant={filterStatus === "pending" ? "default" : "outline"}
                  onClick={() => setFilterStatus("pending")}
                >
                  Pending
                </Button>
                <Button
                  variant={filterStatus === "rejected" ? "default" : "outline"}
                  onClick={() => setFilterStatus("rejected")}
                >
                  Rejected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {getFileIcon(doc.fileType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{doc.type}</h3>
                        {getStatusBadge(doc.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{doc.riderName}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.fileName} • {doc.size} • {formatDate(doc.uploadDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    {doc.status === "pending" && (
                      <Button size="sm" variant="default">
                        <FileCheck className="h-4 w-4 mr-1" />
                        Verify
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}