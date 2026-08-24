// Change Order 01, Phase 1 — the one exported gate everything imports.
// Nothing else in the app should compare a pair/measure count against a
// bare 20; import this instead. The SQL side has its own equivalent,
// publish_threshold(), in supabase/schema.sql — same value, same reason.
export const PUBLISH_THRESHOLD = 20;
