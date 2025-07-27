
import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StageBadge } from "@/components/ui/StatusBadge";
import { ApplicationStage, DocumentType, RiderDocument, TestStatus } from "@/types";
import { ProfileInfo, DocumentInfo, SpendHistory, TimelineView } from "@/components/profile";
import { formatCurrency, formatDate } from "@/components/profile/utils";
import { DocumentList } from "@/components/documents/DocumentList";
import { getDocumentsByRiderId, getRequiredDocuments } from "@/services/documentService";

const Profile = () => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState<RiderDocument[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Mock rider data - in a real application, this would come from an API
  const riderData = {
    id: "R001",
    fullName: currentUser?.name || "Rider User",
    nationality: "UAE",
    phone: "+971 50 123 4567",
    email: currentUser?.email || "",
    bikeType: "Delivery Motorcycle",
    visaNumber: "UAE-987654321",
    licenseNumber: "DXB-12345678",
    applicationStage: "Theory Test" as ApplicationStage,
    testStatus: {
      theory: "Pending" as TestStatus,
      road: "Pending" as TestStatus,
      medical: "Pending" as TestStatus
    },
    joinDate: new Date().toISOString(),
    expectedStart: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    notes: "Needs to complete theory test within 2 weeks."
  };

  // Get required documents based on application stage
  const requiredDocuments = getRequiredDocuments(riderData.applicationStage);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const docs = await getDocumentsByRiderId(riderData.id);
        setDocuments(docs);
      } catch (error) {
        console.error("Error fetching rider documents:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocuments();
  }, [riderData.id]);

  // Mock expense data
  const expenses = [
    { 
      id: "E001", 
      category: "Visa Fees", 
      date: "2025-04-25", 
      amount: 1500, 
      description: "Initial visa application fee" 
    },
    { 
      id: "E002", 
      category: "RTA Tests", 
      date: "2025-05-02", 
      amount: 750, 
      description: "Theory test registration" 
    }
  ];
  
  // Timeline events
  const timelineEvents = [
    {
      title: "Application Submitted",
      date: formatDate(riderData.joinDate),
      description: "Initial application submitted and accepted",
      status: "completed" as const
    },
    {
      title: "Documents Verified",
      date: formatDate("2025-04-20"),
      description: "All required documents have been verified",
      status: "completed" as const
    },
    {
      title: "Theory Test",
      date: `Scheduled for ${formatDate("2025-05-18")}`,
      description: "RTA Theory Test appointment confirmed",
      status: "current" as const
    },
    {
      title: "Road Test",
      date: "Not scheduled yet",
      description: "",
      status: "upcoming" as const
    },
    {
      title: "Expected Start Date",
      date: formatDate(riderData.expectedStart),
      description: "",
      status: "upcoming" as const
    }
  ];

  const handleDocumentsChange = () => {
    // Reload documents after changes
    const fetchDocuments = async () => {
      try {
        const docs = await getDocumentsByRiderId(riderData.id);
        setDocuments(docs);
      } catch (error) {
        console.error("Error fetching rider documents:", error);
      }
    };
    
    fetchDocuments();
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-muted-foreground">
              View and manage your rider profile
            </p>
          </div>
          <StageBadge stage={riderData.applicationStage} size="large" />
        </div>

        <ProfileInfo rider={riderData} />

        <Tabs defaultValue="documents">
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
          
          <TabsContent value="documents" className="space-y-4 mt-4">
            <DocumentInfo 
              visaNumber={riderData.visaNumber}
              licenseNumber={riderData.licenseNumber}
              joinDate={riderData.joinDate}
              expectedStart={riderData.expectedStart}
              testStatus={riderData.testStatus}
              formatDate={formatDate}
            />
            
            <div className="mt-6 border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Upload & Manage Documents</h3>
              {loading ? (
                <div className="text-center py-4">Loading documents...</div>
              ) : (
                <DocumentList
                  documents={documents}
                  riderId={riderData.id}
                  requiredDocuments={requiredDocuments}
                  onDocumentsChange={handleDocumentsChange}
                />
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="expenses" className="space-y-4 mt-4">
            <SpendHistory 
              expenses={expenses}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
            />
          </TabsContent>
          
          <TabsContent value="timeline" className="space-y-4 mt-4">
            <TimelineView 
              events={timelineEvents} 
              formatDate={formatDate} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Profile;
