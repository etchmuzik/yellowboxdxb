export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'admin' | 'finance' | 'operations' | 'rider'
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          role: 'admin' | 'finance' | 'operations' | 'rider'
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'admin' | 'finance' | 'operations' | 'rider'
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      riders: {
        Row: {
          id: string
          talabat_id: string | null
          keeta_id: string | null
          name: string
          nationality: string | null
          email: string | null
          date_of_birth: string | null
          age: number | null
          company_phone: string | null
          personal_phone: string | null
          eid_number: string | null
          passport_number: string | null
          license_number: string | null
          doc_folder_name: string | null
          zone: string | null
          bike_number: string | null
          joining_date: string | null
          onboarding_date: string | null
          offboarding_date: string | null
          status: 'active' | 'onboarding' | 'offboarded' | 'cancelled'
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          talabat_id?: string | null
          keeta_id?: string | null
          name: string
          nationality?: string | null
          email?: string | null
          date_of_birth?: string | null
          age?: number | null
          company_phone?: string | null
          personal_phone?: string | null
          eid_number?: string | null
          passport_number?: string | null
          license_number?: string | null
          doc_folder_name?: string | null
          zone?: string | null
          bike_number?: string | null
          joining_date?: string | null
          onboarding_date?: string | null
          offboarding_date?: string | null
          status?: 'active' | 'onboarding' | 'offboarded' | 'cancelled'
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          talabat_id?: string | null
          keeta_id?: string | null
          name?: string
          nationality?: string | null
          email?: string | null
          date_of_birth?: string | null
          age?: number | null
          company_phone?: string | null
          personal_phone?: string | null
          eid_number?: string | null
          passport_number?: string | null
          license_number?: string | null
          doc_folder_name?: string | null
          zone?: string | null
          bike_number?: string | null
          joining_date?: string | null
          onboarding_date?: string | null
          offboarding_date?: string | null
          status?: 'active' | 'onboarding' | 'offboarded' | 'cancelled'
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      onboarding_applications: {
        Row: {
          id: string
          timestamp: string | null
          email_address: string | null
          fp_name: string | null
          application_date: string | null
          name: string
          emirates_id: string | null
          nationality: string | null
          city: string | null
          date_of_birth: string | null
          age: number | null
          applicant_category: string | null
          application_status: string | null
          remarks: string | null
          reason: string | null
          onboarded_date: string | null
          rider_id: string | null
          alloted_training_date: string | null
          alloted_training_slot: string | null
          trainer_name: string | null
          actual_training_date: string | null
          test_results: string | null
          rider_uuid: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          timestamp?: string | null
          email_address?: string | null
          fp_name?: string | null
          application_date?: string | null
          name: string
          emirates_id?: string | null
          nationality?: string | null
          city?: string | null
          date_of_birth?: string | null
          age?: number | null
          applicant_category?: string | null
          application_status?: string | null
          remarks?: string | null
          reason?: string | null
          onboarded_date?: string | null
          rider_id?: string | null
          alloted_training_date?: string | null
          alloted_training_slot?: string | null
          trainer_name?: string | null
          actual_training_date?: string | null
          test_results?: string | null
          rider_uuid?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          timestamp?: string | null
          email_address?: string | null
          fp_name?: string | null
          application_date?: string | null
          name?: string
          emirates_id?: string | null
          nationality?: string | null
          city?: string | null
          date_of_birth?: string | null
          age?: number | null
          applicant_category?: string | null
          application_status?: string | null
          remarks?: string | null
          reason?: string | null
          onboarded_date?: string | null
          rider_id?: string | null
          alloted_training_date?: string | null
          alloted_training_slot?: string | null
          trainer_name?: string | null
          actual_training_date?: string | null
          test_results?: string | null
          rider_uuid?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      terminations: {
        Row: {
          id: string
          rider_id: string | null
          rider_uuid: string | null
          name: string
          eid_number: string | null
          fleet_partner: string | null
          termination_month: string | null
          deactivation_date: string
          primary_reason: string
          status: 'processing' | 'completed'
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          rider_id?: string | null
          rider_uuid?: string | null
          name: string
          eid_number?: string | null
          fleet_partner?: string | null
          termination_month?: string | null
          deactivation_date: string
          primary_reason: string
          status?: 'processing' | 'completed'
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          rider_id?: string | null
          rider_uuid?: string | null
          name?: string
          eid_number?: string | null
          fleet_partner?: string | null
          termination_month?: string | null
          deactivation_date?: string
          primary_reason?: string
          status?: 'processing' | 'completed'
          created_at?: string
          created_by?: string | null
        }
      }
      platform_migrations: {
        Row: {
          id: string
          talabat_id: string
          keeta_id: string
          rider_name: string | null
          rider_uuid: string | null
          migration_date: string | null
          status: 'pending' | 'completed' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          talabat_id: string
          keeta_id: string
          rider_name?: string | null
          rider_uuid?: string | null
          migration_date?: string | null
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          talabat_id?: string
          keeta_id?: string
          rider_name?: string | null
          rider_uuid?: string | null
          migration_date?: string | null
          status?: 'pending' | 'completed' | 'failed'
          created_at?: string
        }
      }
      new_hires: {
        Row: {
          id: string
          name: string
          phone: string | null
          expected_joining_date: string | null
          status: 'pending' | 'contacted' | 'onboarding' | 'completed'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          expected_joining_date?: string | null
          status?: 'pending' | 'contacted' | 'onboarding' | 'completed'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          expected_joining_date?: string | null
          status?: 'pending' | 'contacted' | 'onboarding' | 'completed'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      trainers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          active?: boolean
          created_at?: string
        }
      }
      zones: {
        Row: {
          id: string
          name: string
          description: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          active?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easy imports
export type Rider = Database['public']['Tables']['riders']['Row']
export type RiderInsert = Database['public']['Tables']['riders']['Insert']
export type RiderUpdate = Database['public']['Tables']['riders']['Update']

export type OnboardingApplication = Database['public']['Tables']['onboarding_applications']['Row']
export type OnboardingApplicationInsert = Database['public']['Tables']['onboarding_applications']['Insert']
export type OnboardingApplicationUpdate = Database['public']['Tables']['onboarding_applications']['Update']

export type Termination = Database['public']['Tables']['terminations']['Row']
export type TerminationInsert = Database['public']['Tables']['terminations']['Insert']
export type TerminationUpdate = Database['public']['Tables']['terminations']['Update']

export type PlatformMigration = Database['public']['Tables']['platform_migrations']['Row']
export type NewHire = Database['public']['Tables']['new_hires']['Row']
export type Trainer = Database['public']['Tables']['trainers']['Row']
export type Zone = Database['public']['Tables']['zones']['Row']

export type User = Database['public']['Tables']['users']['Row']
export type UserRole = User['role']
