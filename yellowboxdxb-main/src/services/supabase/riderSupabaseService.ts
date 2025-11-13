import { supabase } from '../../config/supabase';
import { BaseSupabaseService } from './baseService';
import { Rider, ApplicationStage, TestStatus } from '../../types';

// Define the database structure
interface RiderDB {
  id: string;
  full_name: string;
  nationality?: string;
  phone?: string;
  email?: string;
  bike_type?: string;
  visa_number?: string;
  application_stage: string;
  theory_test_status?: string;
  road_test_status?: string;
  medical_test_status?: string;
  join_date?: string;
  expected_start?: string;
  notes?: string;
  assigned_bike_id?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export class RiderSupabaseService extends BaseSupabaseService<RiderDB> {
  constructor() {
    super('riders');
  }

  /**
   * Get all riders
   */
  static async getAllRiders(): Promise<Rider[]> {
    try {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.convertFromDatabase);
    } catch (error) {
      console.error("Error fetching riders:", error);
      throw error;
    }
  }

  /**
   * Get rider by ID
   */
  static async getRiderById(riderId: string): Promise<Rider | null> {
    try {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .eq('id', riderId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data ? this.convertFromDatabase(data) : null;
    } catch (error) {
      console.error("Error fetching rider:", error);
      throw error;
    }
  }

  /**
   * Get riders by application stage
   */
  static async getRidersByStage(stage: ApplicationStage): Promise<Rider[]> {
    try {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .eq('application_stage', stage)
        .order('join_date', { ascending: false });

      if (error) throw error;

      return (data || []).map(this.convertFromDatabase);
    } catch (error) {
      console.error("Error fetching riders by stage:", error);
      throw error;
    }
  }

  /**
   * Create a new rider
   */
  static async createRider(riderData: Omit<Rider, 'id'>): Promise<string> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User must be authenticated to create riders");
      }

      // Convert to database format
      const dbData = {
        full_name: riderData.fullName,
        nationality: riderData.nationality,
        phone: riderData.phone,
        email: riderData.email,
        bike_type: riderData.bikeType,
        visa_number: riderData.visaNumber,
        application_stage: riderData.applicationStage,
        theory_test_status: riderData.testStatus?.theory || 'Pending',
        road_test_status: riderData.testStatus?.road || 'Pending',
        medical_test_status: riderData.testStatus?.medical || 'Pending',
        join_date: riderData.joinDate,
        expected_start: riderData.expectedStart,
        notes: riderData.notes,
        assigned_bike_id: riderData.assignedBikeId,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('riders')
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;

      // Log activity
      try {
        await supabase
          .from('activity_logs')
          .insert([{
            user_id: user.id,
            action: 'create_rider',
            entity_type: 'rider',
            entity_id: data.id,
            details: {
              riderName: riderData.fullName,
              applicationStage: riderData.applicationStage
            },
            timestamp: new Date().toISOString()
          }]);
      } catch (logError) {
        console.error("Error logging activity:", logError);
      }

      return data.id;
    } catch (error) {
      console.error("Error creating rider:", error);
      throw error;
    }
  }

  /**
   * Update a rider
   */
  static async updateRider(riderId: string, updates: Partial<Rider>): Promise<void> {
    try {
      // Convert updates to database format
      const dbUpdates: Partial<RiderDB> = {
        updated_at: new Date().toISOString()
      };

      if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
      if (updates.nationality !== undefined) dbUpdates.nationality = updates.nationality;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.bikeType !== undefined) dbUpdates.bike_type = updates.bikeType;
      if (updates.visaNumber !== undefined) dbUpdates.visa_number = updates.visaNumber;
      if (updates.applicationStage !== undefined) dbUpdates.application_stage = updates.applicationStage;
      if (updates.joinDate !== undefined) dbUpdates.join_date = updates.joinDate;
      if (updates.expectedStart !== undefined) dbUpdates.expected_start = updates.expectedStart;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.assignedBikeId !== undefined) dbUpdates.assigned_bike_id = updates.assignedBikeId;

      if (updates.testStatus) {
        if (updates.testStatus.theory !== undefined) dbUpdates.theory_test_status = updates.testStatus.theory;
        if (updates.testStatus.road !== undefined) dbUpdates.road_test_status = updates.testStatus.road;
        if (updates.testStatus.medical !== undefined) dbUpdates.medical_test_status = updates.testStatus.medical;
      }

      const { error } = await supabase
        .from('riders')
        .update(dbUpdates)
        .eq('id', riderId);

      if (error) throw error;

      // Log activity if status changed
      if (updates.applicationStage) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            await supabase
              .from('activity_logs')
              .insert([{
                user_id: user.id,
                action: 'update_rider_status',
                entity_type: 'rider',
                entity_id: riderId,
                details: {
                  newStatus: updates.applicationStage
                },
                timestamp: new Date().toISOString()
              }]);
          } catch (logError) {
            console.error("Error logging activity:", logError);
          }
        }
      }
    } catch (error) {
      console.error("Error updating rider:", error);
      throw error;
    }
  }

  /**
   * Delete a rider
   */
  static async deleteRider(riderId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('riders')
        .delete()
        .eq('id', riderId);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting rider:", error);
      throw error;
    }
  }

  /**
   * Convert database row to Rider type
   */
  private static convertFromDatabase(dbRider: any): Rider {
    // Valid ApplicationStage values
    const validStages: ApplicationStage[] = [
      'Applied', 'Docs Verified', 'Theory Test', 'Road Test',
      'Medical', 'ID Issued', 'Active'
    ];

    // Validate and provide fallback for applicationStage
    let applicationStage = dbRider.application_stage as ApplicationStage;
    if (!validStages.includes(applicationStage)) {
      console.error(`Invalid applicationStage "${dbRider.application_stage}" for rider ${dbRider.id}. Defaulting to "Applied".`);
      applicationStage = 'Applied';
    }

    // Valid TestStatus values
    const validTestStatuses: TestStatus[] = ['Pending', 'Pass', 'Fail'];

    // Helper function to validate test status
    const validateTestStatus = (status: string | undefined, field: string): TestStatus => {
      if (!status || !validTestStatuses.includes(status as TestStatus)) {
        if (status) {
          console.error(`Invalid ${field} status "${status}" for rider ${dbRider.id}. Defaulting to "Pending".`);
        }
        return 'Pending';
      }
      return status as TestStatus;
    };

    return {
      id: dbRider.id,
      fullName: dbRider.full_name,
      nationality: dbRider.nationality,
      phone: dbRider.phone,
      email: dbRider.email,
      bikeType: dbRider.bike_type,
      visaNumber: dbRider.visa_number,
      applicationStage,
      testStatus: {
        theory: validateTestStatus(dbRider.theory_test_status, 'theory'),
        road: validateTestStatus(dbRider.road_test_status, 'road'),
        medical: validateTestStatus(dbRider.medical_test_status, 'medical')
      },
      joinDate: dbRider.join_date,
      expectedStart: dbRider.expected_start,
      notes: dbRider.notes,
      assignedBikeId: dbRider.assigned_bike_id,
      documents: [] // Initialize empty documents array
    };
  }

  /**
   * Search riders by name or email
   */
  static async searchRiders(searchTerm: string): Promise<Rider[]> {
    try {
      const { data, error } = await supabase
        .from('riders')
        .select('*')
        .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);

      if (error) throw error;

      return (data || []).map(this.convertFromDatabase);
    } catch (error) {
      console.error("Error searching riders:", error);
      throw error;
    }
  }

  /**
   * Get riders count by stage
   */
  static async getRiderCountByStage(): Promise<Record<ApplicationStage, number>> {
    try {
      const stages: ApplicationStage[] = [
        'Applied', 'Docs Verified', 'Theory Test', 'Road Test',
        'Medical', 'ID Issued', 'Active'
      ];

      const counts: Record<ApplicationStage, number> = {} as Record<ApplicationStage, number>;

      for (const stage of stages) {
        const { count, error } = await supabase
          .from('riders')
          .select('*', { count: 'exact', head: true })
          .eq('application_stage', stage);

        if (error) throw error;
        counts[stage] = count || 0;
      }

      return counts;
    } catch (error) {
      console.error("Error getting rider counts:", error);
      throw error;
    }
  }
}
