
import { RiderFirestoreService } from "./riderFirestoreService";
import { Rider, ApplicationStage } from "../types";

export const getAllRiders = async (): Promise<Rider[]> => {
  return await RiderFirestoreService.getAllRiders();
};

export const getRiderById = async (riderId: string): Promise<Rider | null> => {
  return await RiderFirestoreService.getRiderById(riderId);
};

export const getRidersByStage = async (stage: ApplicationStage): Promise<Rider[]> => {
  return await RiderFirestoreService.getRidersByStage(stage);
};

export const createRider = async (riderData: Omit<Rider, 'id'>): Promise<string> => {
  return await RiderFirestoreService.createRider(riderData);
};

export const updateRider = async (riderId: string, updates: Partial<Rider>): Promise<void> => {
  return await RiderFirestoreService.updateRider(riderId, updates);
};

export const deleteRider = async (riderId: string): Promise<void> => {
  return await RiderFirestoreService.deleteRider(riderId);
};
