import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://31.97.59.237:5557';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc2Mjk0OTUyMCwiZXhwIjo0OTE4NjIzMTIwLCJyb2xlIjoiYW5vbiJ9.GSGsqnPTjpZKxI351mf7NBV_FxejYs6hn4KO1f9Rx3M';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'yellowbox-fleet-management',
    },
  },
});

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  if (error.message) {
    throw new Error(error.message);
  }
  throw error;
};

// Export types for use throughout the app
export type { Database };
