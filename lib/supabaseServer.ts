import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-only client. Uses the service role key so the anon/public key never
// needs to exist client-side and RLS can stay locked down with zero policies.
// Never import this file from a Client Component.

let client: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    const missing = [];
    if (!supabaseUrl) missing.push("SUPABASE_URL");
    if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
    throw new Error(
      `Missing environment variable(s): ${missing.join(", ")}. ` +
      "See FIX_RESULTS_API.md for instructions.",
    );
  }

  client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  return client;
}
