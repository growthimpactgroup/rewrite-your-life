// Change Order 01, Phase 1 — the one exported gate everything imports.
// Nothing else in the app should compare a pair/measure count against a
// bare 20; import this instead. The SQL side has its own equivalent,
// publish_threshold(), in supabase/schema.sql — same value, same reason.
//
// Set to 0 on 2026-08-26 at Frances's explicit request, to show the real
// current numbers to a client immediately rather than waiting for 20 real
// finishers. This turns every `count >= PUBLISH_THRESHOLD` check into an
// unconditional true (a count is never negative), so nothing is withheld
// regardless of how few people have finished. The privacy protection this
// number existed for — a very small group's average can expose an
// individual — no longer applies while this is 0. Reversible: restoring
// this to 20 (and re-running the matching SQL migration) brings the
// original protection back everywhere at once.
export const PUBLISH_THRESHOLD = 0;
