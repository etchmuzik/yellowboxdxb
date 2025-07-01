
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { Bike } from "../types";

const COLLECTION = "bikes";

export const getBikes = async (): Promise<Bike[]> => {
  const bikesSnapshot = await getDocs(collection(db, COLLECTION));
  return bikesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bike));
};

export const getBikeById = async (bikeId: string): Promise<Bike | null> => {
  const bikeDoc = await getDoc(doc(db, COLLECTION, bikeId));
  if (bikeDoc.exists()) {
    return { id: bikeDoc.id, ...bikeDoc.data() } as Bike;
  }
  return null;
};

export const createBike = async (bikeData: Omit<Bike, "id">): Promise<Bike> => {
  const newBikeRef = doc(collection(db, COLLECTION));
  const newBike = { id: newBikeRef.id, ...bikeData };
  await setDoc(newBikeRef, bikeData);
  return newBike;
};

export const updateBike = async (bikeId: string, bikeData: Partial<Bike>): Promise<void> => {
  await updateDoc(doc(db, COLLECTION, bikeId), bikeData);
};

export const deleteBike = async (bikeId: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, bikeId));
};

export const getBikesByStatus = async (status: Bike['status']): Promise<Bike[]> => {
  const q = query(collection(db, COLLECTION), where("status", "==", status));
  const bikesSnapshot = await getDocs(q);
  return bikesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bike));
};

export const getBikeByGpsTrackerId = async (gpsTrackerId: string): Promise<Bike | null> => {
  const q = query(collection(db, COLLECTION), where("gpsTrackerId", "==", gpsTrackerId));
  const bikesSnapshot = await getDocs(q);
  
  if (bikesSnapshot.empty) {
    return null;
  }
  
  const bikeDoc = bikesSnapshot.docs[0];
  return { id: bikeDoc.id, ...bikeDoc.data() } as Bike;
};

export const getBikeByRiderId = async (riderId: string): Promise<Bike | null> => {
  const q = query(collection(db, COLLECTION), where("assignedRiderId", "==", riderId));
  const bikesSnapshot = await getDocs(q);
  
  if (bikesSnapshot.empty) {
    return null;
  }
  
  const bikeDoc = bikesSnapshot.docs[0];
  return { id: bikeDoc.id, ...bikeDoc.data() } as Bike;
};

export const assignBikeToRider = async (bikeId: string, riderId: string): Promise<void> => {
  await updateDoc(doc(db, COLLECTION, bikeId), { 
    assignedRiderId: riderId,
    status: 'Assigned'
  });
};

export const unassignBike = async (bikeId: string): Promise<void> => {
  await updateDoc(doc(db, COLLECTION, bikeId), { 
    assignedRiderId: null,
    status: 'Available'
  });
};
