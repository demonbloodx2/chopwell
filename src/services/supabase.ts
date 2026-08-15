import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';

// Import environment variables from .env files
const supabaseUrl = SUPABASE_URL || '';
const supabaseAnonKey = SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase credentials. Please check your .env file and ensure SUPABASE_URL and SUPABASE_ANON_KEY are set.'
  );
}

/**
 * Supabase client instance configured for offline-first architecture
 *
 * Security: Uses only the anon key (public key), never the service role key.
 * The anon key is safe for client-side use as all security is enforced
 * at the data layer via Row Level Security (RLS) policies.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
