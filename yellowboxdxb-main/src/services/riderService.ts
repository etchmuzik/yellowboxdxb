
import { RiderSupabaseService as RiderFirestoreService } from "./supabase/riderSupabaseService";
import { Rider, ApplicationStage } from "../types";
import { triggerSync } from "./webhookService";

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
  const riderId = await RiderFirestoreService.createRider(riderData);
  
  // Trigger webhook for N8N sync
  await triggerSync('rider', riderId, 'created', { ...riderData, id: riderId });
  
  return riderId;
};

export const updateRider = async (riderId: string, updates: Partial<Rider>): Promise<void> => {
  await RiderFirestoreService.updateRider(riderId, updates);
  
  // Get updated rider data for webhook
  const updatedRider = await RiderFirestoreService.getRiderById(riderId);
  if (updatedRider) {
    await triggerSync('rider', riderId, 'updated', updatedRider);
  }
};

export const deleteRider = async (riderId: string): Promise<void> => {
  // Get rider data before deletion for webhook
  const riderData = await RiderFirestoreService.getRiderById(riderId);
  
  await RiderFirestoreService.deleteRider(riderId);
  
  // Trigger webhook for N8N sync
  if (riderData) {
    await triggerSync('rider', riderId, 'deleted', riderData);
  }
};
