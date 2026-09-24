// Change Order 01, Phase 1 — the one exported gate everything imports.
// Nothing else in the app should compare a pair/measure count against a
// bare 20; import this instead. The SQL side has its own equivalent,
// publish_threshold(), in supabase/schema.sql — same value, same reason.
//
// Was set to 0 on 2026-08-26 at Frances's explicit request, to show the
// real current numbers to a client immediately rather than waiting for 20
// real finishers. Restored to 20 on 2026-09-24, alongside a fresh-start
// reset of record_starts_at to 2026-09-28 (see supabase/schema.sql's
// "Launch cutoff date" block) — small-group averages can expose an
// individual below this size, and that protection should be back in place
// for the real relaunch. The SQL side (publish_threshold() in
// supabase/schema.sql) must independently match this value — the schema
// file already said 20, but the live database was still running an older
// migration that returned 0 until this same pass fixed it directly.
export const PUBLISH_THRESHOLD = 20;
