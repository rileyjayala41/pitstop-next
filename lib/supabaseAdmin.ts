import { createClient } from "@supabase/supabase-js";

function getEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in environment variables`);
  return v;
}

/**
 * Admin client (server-only)
 * Uses the SERVICE ROLE key — never use this in client components.
 */
export function getSupabaseAdmin() {
  const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

/**
 * Convenient singleton export
 * (Matches how your API routes import it)
 */
export const supabaseAdmin = getSupabaseAdmin();
