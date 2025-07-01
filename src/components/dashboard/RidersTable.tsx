
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { StageBadge } from "@/components/ui/StatusBadge";
import { formatCurrency } from "@/utils/dataUtils";
import { ApplicationStage, Rider } from "@/types";
import { MoreHorizontal } from "lucide-react";
import { getAllRiders } from "@/services/riderService";
import { getExpensesByRider } from "@/services/expenseService";

interface RiderWithSpend extends Rider {
  totalSpend: number;
}

export function RidersTable() {
  const navigate = useNavigate();
  const [ridersWithSpend, setRidersWithSpend] = useState<RiderWithSpend[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<ApplicationStage | 'All'>('All');

  useEffect(() => {
    const fetchRidersWithSpend = async () => {
      try {
        const riders = await getAllRiders();
        const ridersWithSpendData = await Promise.all(
          riders.map(async (rider) => {
            try {
              const expenses = await getExpensesByRider(rider.id);
              const totalSpend = expenses.reduce((sum, expense) => sum + expense.amount, 0);
              return { ...rider, totalSpend };
            } catch (error) {
              console.error(`Error fetching expenses for rider ${rider.id}:`, error);
              return { ...rider, totalSpend: 0 };
            }
          })
        );
        setRidersWithSpend(ridersWithSpendData);
      } catch (error) {
        console.error("Error fetching riders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRidersWithSpend();
  }, []);
  
  const filteredRiders = stageFilter === 'All'
    ? ridersWithSpend
    : ridersWithSpend.filter(rider => rider.applicationStage === stageFilter);

  if (loading) {
    return (
      <div className="mt-6">
        <h3 className="font-medium text-xl mb-4">Riders Overview</h3>
        <div className="rounded-md border p-6">
          <p className="text-center text-muted-foreground">Loading riders...</p>
        </div>
      </div>
    );
  }
  
  const handleViewRider = (riderId: string) => {
    navigate(`/riders/${riderId}`);
  };

  const stages: (ApplicationStage | 'All')[] = [
    'All',
    'Applied',
    'Docs Verified',
    'Theory Test',
    'Road Test',
    'Medical',
    'ID Issued',
    'Active'
  ];

  return (
    <div className="mt-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <h3 className="font-medium text-xl">Riders Overview</h3>
        
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
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Application Stage</TableHead>
              <TableHead className="text-right">Total Spend</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRiders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No riders match your filter criteria
                </TableCell>
              </TableRow>
            ) : (
              filteredRiders.map((rider) => (
                <TableRow key={rider.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewRider(rider.id)}>
                  <TableCell>
                    <div className="font-medium">{rider.fullName}</div>
                    <div className="text-sm text-muted-foreground">{rider.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {rider.testStatus.theory !== 'Pending' && (
                        <div className={`badge ${rider.testStatus.theory === 'Pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          Theory: {rider.testStatus.theory}
                        </div>
                      )}
                      {rider.testStatus.road !== 'Pending' && (
                        <div className={`badge ${rider.testStatus.road === 'Pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          Road: {rider.testStatus.road}
                        </div>
                      )}
                      {rider.testStatus.medical !== 'Pending' && (
                        <div className={`badge ${rider.testStatus.medical === 'Pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          Medical: {rider.testStatus.medical}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StageBadge stage={rider.applicationStage} />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(rider.totalSpend)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleViewRider(rider.id);
                        }}>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          Add expense
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          Update status
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
