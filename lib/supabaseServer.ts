import { createClient } from "@supabase/supabase-js";

/**
 * supabaseServer (SERVER ONLY)
 * Used by server components like /admin/leads to READ leads.
 *
 * Uses SERVICE ROLE so it:
 * - Always reads (not blocked by RLS)
 * - Always points to the same project as your /api/leads route
 *
 * Requires:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

function env(name: string) {
  const v = process.env[name];
  if (!v || !v.trim()) throw new Error(`Missing ${name} in environment variables`);
  return v.trim();
}

const SUPABASE_URL = env("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");

export const supabaseServer = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
