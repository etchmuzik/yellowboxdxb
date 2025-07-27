
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { TestStatus, Rider, SpendEvent } from "@/types";
import { RiderHeader } from "./detail/RiderHeader";
import { RiderInfoCard } from "./detail/RiderInfoCard";
import { TestStatusCard } from "./detail/TestStatusCard";
import { ExpenseLedger } from "./detail/ExpenseLedger";
import { NotFoundCard } from "./detail/NotFoundCard";
import { getRiderById } from "@/services/riderService";
import { getExpensesByRider } from "@/services/expenseService";

export function RiderDetail() {
  const { riderId } = useParams<{ riderId: string }>();
  const [rider, setRider] = useState<Rider | null>(null);
  const [riderSpendEvents, setRiderSpendEvents] = useState<SpendEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  
  const [theoryStatus, setTheoryStatus] = useState<TestStatus>("Pending");
  const [roadStatus, setRoadStatus] = useState<TestStatus>("Pending");
  const [medicalStatus, setMedicalStatus] = useState<TestStatus>("Pending");

  useEffect(() => {
    const fetchRiderData = async () => {
      if (!riderId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const [riderData, expenseData] = await Promise.all([
          getRiderById(riderId),
          getExpensesByRider(riderId)
        ]);

        if (!riderData) {
          setNotFound(true);
        } else {
          setRider(riderData);
          setRiderSpendEvents(expenseData);
          setTheoryStatus(riderData.testStatus.theory);
          setRoadStatus(riderData.testStatus.road);
          setMedicalStatus(riderData.testStatus.medical);
        }
      } catch (error) {
        console.error("Error fetching rider data:", error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchRiderData();
  }, [riderId]);

  // Calculate total spend
  const totalSpend = riderSpendEvents.reduce(
    (acc, event) => acc + event.amount,
    0
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-10">
          <p className="text-muted-foreground">Loading rider details...</p>
        </div>
      </div>
    );
  }

  if (notFound || !rider) {
    return <NotFoundCard />;
  }

  // Define application stages for the timeline
  const stages = [
    "Applied",
    "Docs Verified",
    "Theory Test",
    "Road Test",
    "Medical",
    "ID Issued",
    "Active",
  ];

  const currentStageIndex = stages.indexOf(rider.applicationStage);

  return (
    <div className="space-y-6">
      <RiderHeader
        riderId={rider.id}
        fullName={rider.fullName}
        email={rider.email}
        phone={rider.phone}
        rider={rider}
        expenses={riderSpendEvents}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <RiderInfoCard
          nationality={rider.nationality}
          bikeType={rider.bikeType}
          visaNumber={rider.visaNumber}
          joinDate={rider.joinDate}
          expectedStart={rider.expectedStart}
          notes={rider.notes}
          applicationStage={rider.applicationStage}
          currentStageIndex={currentStageIndex}
          riderId={rider.id}
        />

        <TestStatusCard
          theoryStatus={theoryStatus}
          roadStatus={roadStatus}
          medicalStatus={medicalStatus}
          applicationStage={rider.applicationStage}
          onTheoryStatusChange={setTheoryStatus}
          onRoadStatusChange={setRoadStatus}
          onMedicalStatusChange={setMedicalStatus}
        />
      </div>

      <ExpenseLedger 
        spendEvents={riderSpendEvents} 
        totalSpend={totalSpend}
      />
    </div>
  );
}
