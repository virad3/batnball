import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = "https://lfszuhtwwqipcttxfphx.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxmc3p1aHR3d3FpcGN0dHhmcGh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxNjA0OTUsImV4cCI6MjA2NTczNjQ5NX0.zsFB7cEQ8zwhzDsIHlfW2eWK_HU1riNnuAxRmQ01CnY";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);