import { createClient } from '@supabase/supabase-js';

// Aleyart Academy Supabase Configuration
const supabaseUrl = 'https://gjhohrzihrqpwmgelnlk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqaG9ocnppaHJxcHdtZ2VsbmxrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MDI2ODAsImV4cCI6MjA5Nzk3ODY4MH0.fkWNRXCSMH2LMg_4eCFNguTjfGMFwYCpEn0pMUGLapM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl.includes('.supabase.co') && 
         supabaseAnonKey.length > 50;
};
