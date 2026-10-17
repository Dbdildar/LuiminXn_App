// Supabase client for React Native. The anon (publishable) key is safe to ship
// as long as Row Level Security is on. NEVER put the service_role key here.
// Tip: move both values into react-native-config / .env before release.
import 'react-native-url-polyfill/auto';
import {createClient} from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://vfubnykeohrrcszsbszm.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmdWJueWtlb2hycmNzenNic3ptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU0MDczOTYsImV4cCI6MjEwMDk4MzM5Nn0.goepfCdNPvZAtT5JkM79tc0wJt9Y5wwlJiqr_SB0nY4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false},
});
