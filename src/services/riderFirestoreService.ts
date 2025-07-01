
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
    return {
      id: firestoreRider.id,
      fullName: firestoreRider.fullName,
      nationality: firestoreRider.nationality,
      phone: firestoreRider.phone,
      email: firestoreRider.email,
      bikeType: firestoreRider.bikeType,
      visaNumber: firestoreRider.visaNumber,
      applicationStage: firestoreRider.applicationStage as ApplicationStage,
      testStatus: {
        theory: firestoreRider.testStatus.theory as TestStatus,
        road: firestoreRider.testStatus.road as TestStatus,
        medical: firestoreRider.testStatus.medical as TestStatus
      },
      joinDate: firestoreRider.joinDate,
      expectedStart: firestoreRider.expectedStart,
      notes: firestoreRider.notes,
      assignedBikeId: firestoreRider.assignedBikeId
    };
  }
}
