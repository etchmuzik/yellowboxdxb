
import { where, orderBy } from "firebase/firestore";
import { FirestoreService } from "./firestoreService";
import { COLLECTIONS, FirestoreRider } from "@/config/firestore-schema";
import { Rider, ApplicationStage, TestStatus } from "@/types";
import { auth } from "@/config/firebase";

export class RiderFirestoreService {
  static async getAllRiders(): Promise<Rider[]> {
    try {
      const firestoreRiders = await FirestoreService.getCollection<FirestoreRider>(COLLECTIONS.RIDERS);
      return firestoreRiders.map(this.convertFromFirestore);
    } catch (error) {
      console.error("Error fetching riders:", error);
      throw error;
    }
  }

  static async getRiderById(riderId: string): Promise<Rider | null> {
    try {
      const firestoreRider = await FirestoreService.getDocument<FirestoreRider>(COLLECTIONS.RIDERS, riderId);
      return firestoreRider ? this.convertFromFirestore(firestoreRider) : null;
    } catch (error) {
      console.error("Error fetching rider:", error);
      throw error;
    }
  }

  static async getRidersByStage(stage: ApplicationStage): Promise<Rider[]> {
    try {
      const firestoreRiders = await FirestoreService.queryCollection<FirestoreRider>(
        COLLECTIONS.RIDERS,
        where("applicationStage", "==", stage),
        orderBy("joinDate", "desc")
      );
      return firestoreRiders.map(this.convertFromFirestore);
    } catch (error) {
      console.error("Error fetching riders by stage:", error);
      throw error;
    }
  }

  static async createRider(riderData: Omit<Rider, 'id'>): Promise<string> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User must be authenticated to create riders");
      }

      const firestoreData: Omit<FirestoreRider, 'id'> = {
        ...riderData,
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return await FirestoreService.addDocument<FirestoreRider>(COLLECTIONS.RIDERS, firestoreData);
    } catch (error) {
      console.error("Error creating rider:", error);
      throw error;
    }
  }

  static async updateRider(riderId: string, updates: Partial<Rider>): Promise<void> {
    try {
      const firestoreUpdates = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await FirestoreService.updateDocument(COLLECTIONS.RIDERS, riderId, firestoreUpdates);
    } catch (error) {
      console.error("Error updating rider:", error);
      throw error;
    }
  }

  static async deleteRider(riderId: string): Promise<void> {
    try {
      await FirestoreService.deleteDocument(COLLECTIONS.RIDERS, riderId);
    } catch (error) {
      console.error("Error deleting rider:", error);
      throw error;
    }
  }

  // Convert Firestore document to Rider type
  private static convertFromFirestore(firestoreRider: FirestoreRider): Rider {
    // Valid ApplicationStage values
    const validStages: ApplicationStage[] = [
      'Applied', 'Docs Verified', 'Theory Test', 'Road Test', 
      'Medical', 'ID Issued', 'Active'
    ];
    
    // Validate and provide fallback for applicationStage
    let applicationStage = firestoreRider.applicationStage as ApplicationStage;
    if (!validStages.includes(applicationStage)) {
      console.error(`Invalid applicationStage "${firestoreRider.applicationStage}" for rider ${firestoreRider.id}. Defaulting to "Applied".`);
      applicationStage = 'Applied';
    }
    
    // Valid TestStatus values
    const validTestStatuses: TestStatus[] = ['Pending', 'Pass', 'Fail'];
    
    // Helper function to validate test status
    const validateTestStatus = (status: string, field: string): TestStatus => {
      if (!validTestStatuses.includes(status as TestStatus)) {
        console.error(`Invalid ${field} status "${status}" for rider ${firestoreRider.id}. Defaulting to "Pending".`);
        return 'Pending';
      }
      return status as TestStatus;
    };
    
    return {
      id: firestoreRider.id,
      fullName: firestoreRider.fullName,
      nationality: firestoreRider.nationality,
      phone: firestoreRider.phone,
      email: firestoreRider.email,
      bikeType: firestoreRider.bikeType,
      visaNumber: firestoreRider.visaNumber,
      applicationStage,
      testStatus: {
        theory: validateTestStatus(firestoreRider.testStatus.theory, 'theory'),
        road: validateTestStatus(firestoreRider.testStatus.road, 'road'),
        medical: validateTestStatus(firestoreRider.testStatus.medical, 'medical')
      },
      joinDate: firestoreRider.joinDate,
      expectedStart: firestoreRider.expectedStart,
      notes: firestoreRider.notes,
      assignedBikeId: firestoreRider.assignedBikeId
    };
  }
}
