import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Anon-key client, server-side only. Unlike supabaseServer.ts, this key is
// safe to be public — RLS scopes it to SELECT on public_aggregates and
// nothing else (see supabase/schema.sql, Phase A). Used only by
// /aggregates.json and /aggregates.csv, so a bug in either route
// structurally cannot reach assessment_responses, scored, or matched_pairs.

let client: SupabaseClient | null = null;

export function getSupabasePublicClient(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.");
  }

  client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
  });
  return client;
}
