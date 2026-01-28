/**
 * Supabase Client (Stub Mode)
 *
 * Stub implementation for development without Supabase connection.
 * Replace with real implementation when Supabase is configured.
 */

// Stub client that doesn't connect to Supabase
const stubClient = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    onAuthStateChange: (_callback: unknown) => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
    signUp: async () => ({ data: { user: null, session: null }, error: null }),
    signInWithOAuth: async () => ({ data: { url: null, provider: null }, error: null }),
    signOut: async () => ({ error: null }),
  },
  from: (table: string) => ({
    select: () => stubQuery(table),
    insert: () => stubQuery(table),
    update: () => stubQuery(table),
    delete: () => stubQuery(table),
    upsert: () => stubQuery(table),
  }),
};

function stubQuery(_table: string) {
  return {
    select: () => stubQuery(_table),
    eq: () => stubQuery(_table),
    neq: () => stubQuery(_table),
    single: () => Promise.resolve({ data: null, error: null }),
    order: () => stubQuery(_table),
    limit: () => stubQuery(_table),
    then: (resolve: (value: { data: null; error: null }) => void) =>
      resolve({ data: null, error: null }),
  };
}

/**
 * Browser client - stub version
 */
export function createClient() {
  return stubClient;
}

// Default export for convenience
export const supabase = stubClient;

export default supabase;
