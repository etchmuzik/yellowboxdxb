
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StageBadge } from "@/components/ui/StatusBadge";
import { ApplicationStage, Rider } from "@/types";
import { SimpleRider } from "@/services/simpleFirebaseService";
import { Plus, Search, Users, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EnhancedRiderForm } from "@/components/EnhancedRiderForm";
import { simpleRiderService } from "@/services/simpleFirebaseService";

const Riders = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<ApplicationStage | "All">("All");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchRiders = async () => {
      try {
        console.log('🔄 Fetching riders...');
        const data = await simpleRiderService.getAll();
        console.log('✅ Riders fetched:', data.length, data);

        // Convert simple rider data to match expected Rider interface
        const convertedRiders = data.map(rider => ({
          id: rider.id || '',
          fullName: rider.fullName,
          nationality: rider.nationality || 'UAE',
          phone: rider.phone,
          email: rider.email,
          bikeType: 'Standard', // Default value
          visaNumber: '', // Default value
          applicationStage: (rider.status as ApplicationStage) || 'Applied',
          testStatus: {
            theory: 'Pending' as const,
            road: 'Pending' as const,
            medical: 'Pending' as const
          },
          joinDate: rider.createdAt?.toISOString() || new Date().toISOString(),
          expectedStart: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          notes: '',
          assignedBikeId: null,
          documents: []
        }));

        setRiders(convertedRiders);
      } catch (error) {
        console.error("❌ Error fetching riders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRiders();
  }, [refreshTrigger]);

  const handleRiderAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const filteredRiders = riders.filter(rider => {
    // Filter by search query
    const matchesSearch = searchQuery === "" ||
      rider.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rider.phone.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by stage
    const matchesStage = stageFilter === "All" || rider.applicationStage === stageFilter;

    return matchesSearch && matchesStage;
  });

  const stages: (ApplicationStage | "All")[] = [
    "All",
    "Applied",
    "Docs Verified",
    "Theory Test",
    "Road Test",
    "Medical",
    "ID Issued",
    "Active",
  ];

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">Riders</h1>
              <p className="text-muted-foreground">
                Manage rider applications and onboarding
              </p>
            </div>
          </div>
          <div className="rounded-md border p-6">
            <p className="text-center text-muted-foreground">Loading riders...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">🏍️ Riders Management</h1>
            <p className="text-muted-foreground">
              Easy rider onboarding and management system
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{riders.length} Total Riders</span>
          </div>
        </div>

        <Tabs defaultValue="add-rider" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add-rider" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              ➕ Add New Rider
            </TabsTrigger>
            <TabsTrigger value="view-riders" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              👥 View All Riders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="add-rider" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                  Quick Rider Registration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <EnhancedRiderForm onSuccess={handleRiderAdded} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="view-riders" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search riders by name, email, or phone..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {stages.map((stage) => (
                  <Button
                    key={stage}
                    variant={stageFilter === stage ? "default" : "outline"}
                    size="sm"
                    className={stageFilter === stage ? "bg-blue-600 hover:bg-blue-700" : ""}
                    onClick={() => setStageFilter(stage)}
                  >
                    {stage}
                  </Button>
                ))}
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[180px]">Name</TableHead>
                        <TableHead className="min-w-[120px]">Nationality</TableHead>
                        <TableHead className="min-w-[120px]">Bike Type</TableHead>
                        <TableHead className="min-w-[150px]">Application Stage</TableHead>
                        <TableHead className="min-w-[130px]">Join Date</TableHead>
                        <TableHead className="min-w-[130px]">Expected Start</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRiders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                            {riders.length === 0 ? (
                              <div className="space-y-2">
                                <Users className="h-12 w-12 mx-auto text-gray-300" />
                                <p>No riders found. Add your first rider using the form above!</p>
                              </div>
                            ) : (
                              "No riders match your search criteria"
                            )}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRiders.map((rider) => (
                          <TableRow
                            key={rider.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/riders/${rider.id}`)}
                          >
                            <TableCell>
                              <div className="font-medium">{rider.fullName}</div>
                              <div className="text-sm text-muted-foreground">{rider.email}</div>
                            </TableCell>
                            <TableCell>{rider.nationality}</TableCell>
                            <TableCell>{rider.bikeType}</TableCell>
                            <TableCell>
                              <StageBadge stage={rider.applicationStage} />
                            </TableCell>
                            <TableCell>
                              {new Date(rider.joinDate).toLocaleDateString('en-AE')}
                            </TableCell>
                            <TableCell>
                              {new Date(rider.expectedStart).toLocaleDateString('en-AE')}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Riders;
