/**
 * Supabase Server Client (Stub Mode)
 *
 * Stub implementation for development without Supabase connection.
 * Replace with real implementation when Supabase is configured.
 */

// Stub server client
function createStubServerClient() {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: (table: string) => createStubQuery(table),
  };
}

function createStubQuery(_table: string): StubQueryBuilder {
  const builder: StubQueryBuilder = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    upsert: () => builder,
    eq: () => builder,
    neq: () => builder,
    single: () => Promise.resolve({ data: null, error: null }),
    order: () => builder,
    limit: () => builder,
  };
  return builder;
}

interface StubQueryBuilder {
  select: (columns?: string) => StubQueryBuilder;
  insert: (data: unknown) => StubQueryBuilder;
  update: (data: unknown) => StubQueryBuilder;
  delete: () => StubQueryBuilder;
  upsert: (data: unknown, options?: unknown) => StubQueryBuilder;
  eq: (column: string, value: unknown) => StubQueryBuilder;
  neq: (column: string, value: unknown) => StubQueryBuilder;
  single: () => Promise<{ data: null; error: null }>;
  order: (column: string, options?: unknown) => StubQueryBuilder;
  limit: (count: number) => StubQueryBuilder;
}

/**
 * Create a Supabase client for Server Components (stub)
 */
export async function createServerClient() {
  return createStubServerClient();
}

/**
 * Create a Supabase admin client (stub)
 */
export function createAdminClient() {
  return createStubServerClient();
}
