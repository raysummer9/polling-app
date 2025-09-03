import { createBrowserClient } from '@supabase/ssr';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/types/database';

// Environment variables validation
const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

// Validate environment variables
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

// Client configuration
const clientConfig = {
  url: requiredEnvVars.NEXT_PUBLIC_SUPABASE_URL!,
  anonKey: requiredEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
};

/**
 * Creates a browser client for client-side operations
 * @returns Supabase browser client instance
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(
    clientConfig.url,
    clientConfig.anonKey
  );
}

/**
 * Creates a server client for server-side operations
 * @returns Supabase server client instance
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    clientConfig.url,
    clientConfig.anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates a service role client for admin operations
 * This should only be used in secure server-side contexts
 * @returns Supabase service role client instance
 */
export function createServiceRoleClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required for service role operations');
  }

  return createBrowserClient<Database>(
    clientConfig.url,
    serviceRoleKey
  );
}

/**
 * Creates a client based on the current environment
 * @param context - The context where the client will be used
 * @returns Appropriate Supabase client instance
 */
export async function createSupabaseClient(context: 'browser' | 'server' | 'service-role' = 'browser') {
  switch (context) {
    case 'browser':
      return createBrowserSupabaseClient();
    case 'server':
      return createServerSupabaseClient();
    case 'service-role':
      return createServiceRoleClient();
    default:
      throw new Error(`Invalid context: ${context}`);
  }
}

// Re-export for backward compatibility
export { createBrowserSupabaseClient as createClient };
export { createServerSupabaseClient as createServerClient };
