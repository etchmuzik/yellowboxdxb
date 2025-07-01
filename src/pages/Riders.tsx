
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Plus, Search } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { AddRiderForm } from "@/components/riders/AddRiderForm";
import { getAllRiders } from "@/services/riderService";

const Riders = () => {
  const navigate = useNavigate();
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<ApplicationStage | "All">("All");
  const [isAddRiderOpen, setIsAddRiderOpen] = useState(false);

  useEffect(() => {
    const fetchRiders = async () => {
      try {
        const data = await getAllRiders();
        setRiders(data);
      } catch (error) {
        console.error("Error fetching riders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRiders();
  }, []);

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
            <h1 className="text-3xl font-bold mb-1">Riders</h1>
            <p className="text-muted-foreground">
              Manage rider applications and onboarding
            </p>
          </div>
          
          <Button onClick={() => setIsAddRiderOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add New Rider
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search riders..."
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
                className={stageFilter === stage ? "bg-nike-red hover:bg-nike-red/90" : ""}
                onClick={() => setStageFilter(stage)}
              >
                {stage}
              </Button>
            ))}
          </div>
        </div>

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
                    No riders match your search criteria
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
      </div>

      <Dialog open={isAddRiderOpen} onOpenChange={setIsAddRiderOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Rider</DialogTitle>
          </DialogHeader>
          <AddRiderForm 
            onSuccess={() => setIsAddRiderOpen(false)} 
            onCancel={() => setIsAddRiderOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Riders;
