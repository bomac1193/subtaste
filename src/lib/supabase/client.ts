/**
 * Supabase Client
 *
 * Provides Supabase clients for browser and server contexts.
 */

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

/**
 * Browser client - uses anon key, handles auth cookies automatically
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Default export for convenience
export const supabase = createClient();

export default supabase;
