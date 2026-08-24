import type { PublicAggregates } from "./publicAggregates";

// Change Order 01, Phase 1 — seeded preview dataset for /results?preview=published.
// Numbers match the Change Order's own Target A/B/D/F mockups exactly (89
// finished pairs, 78% improved, 7% declined, etc.) — reusing GIG's own
// reference figures rather than inventing new ones. Labelled, seeded,
// structurally incapable of reaching the real public build: this object is
// never read from the database and never written to it.
//
// Per-person deltas: 89 values, ~78% at +5 or more (green), ~15% within ±4
// (grey), ~7% at -5 or less (red) — matching Target F's dot-plot caption
// ("78% / 15% / 7%", median +14) exactly.
function buildPreviewPersonDeltas(): number[] {
  const declines = [-14, -11, -9, -6, -5, -5]; // 6 of 89, matches "6 of 89 finishers declined"
  const flat = [-2, -1, 0, 0, 1, 2, 2, 3, 3, 4, 4, -3, -4, 1]; // 14 of 89 (~15%)
  const improved: number[] = [];
  // 69 of 89 (~78%) improved, spread from +5 to +34, centered near the
  // median the target caption states (+14).
  for (let i = 0; i < 69; i++) {
    const spread = 5 + Math.round(29 * (i / 68)); // 5..34
    improved.push(spread);
  }
  return [...declines, ...flat, ...improved];
}

const PERSON_DELTAS = buildPreviewPersonDeltas();

function metric(
  key: string,
  label: string,
  type: "domain" | "anchor",
  day0: number,
  week10: number,
  decimals = 0,
): PublicAggregates["metrics"][number] {
  const delta_pts = Math.round((week10 - day0) * 10 ** decimals) / 10 ** decimals;
  const delta_pct = Math.round(((week10 - day0) / day0) * 100);
  return { key, label, type, day0_avg: day0, week10_avg: week10, delta_pts, delta_pct, n: 89, published: true };
}

export const PREVIEW_PUBLISHED_AGGREGATES: PublicAggregates = {
  course: "ryl",
  computed_at: new Date().toISOString(),
  measured_since: "2026-01-01T00:00:00.000Z",
  last_anchor_date: null,
  record_starts_at: null,
  funnel: {
    total_submissions: 214,
    n_started: 143,
    n_in_progress: 40,
    n_eligible: 103,
    n_pairs: 89,
    completion_rate: 86,
  },
  distribution: {
    published: true,
    pct_improved: 78,
    pct_flat: 15,
    pct_declined: 7,
    n_declined: 6,
  },
  hygiene: {
    n_excluded_straightline: 3,
  },
  metrics: [
    metric("ai_index", "AI Orchestration Index", "domain", 31, 57),
    metric("execution", "Execution", "domain", 49, 70),
    metric("clear_thinking", "Clear Thinking", "domain", 52, 71),
    metric("purpose", "Purpose", "domain", 54, 73),
    metric("emotional", "Emotional Steadiness", "domain", 48, 66),
    metric("adversity", "Adversity Recovery", "domain", 51, 69),
    metric("presence", "Presence", "domain", 50, 68),
    metric("frame", "Frame Control", "domain", 46, 61),
    metric("learning", "Learning Agility", "domain", 58, 72),
    metric("situational", "Situational Awareness", "domain", 55, 67),
    metric("life_satisfaction", "Overall Life Satisfaction", "anchor", 5.4, 7.1, 1),
    metric("mornings_with_priority", "Mornings With a Known Priority", "anchor", 5.2, 9.8, 1),
    metric("confidence_next_12mo", "Confidence in the Next 12 Months", "anchor", 5.8, 7.6, 1),
  ],
  person_deltas: PERSON_DELTAS,
};

/** Same shape, sub-threshold — for exercising the withheld state against
 * seeded data (Phase 1's own GATE: "preview at 19 pairs... withhold"). Not
 * wired to a public URL; used for local verification only. */
export const PREVIEW_WITHHELD_AGGREGATES: PublicAggregates = {
  ...PREVIEW_PUBLISHED_AGGREGATES,
  funnel: { total_submissions: 40, n_started: 25, n_in_progress: 3, n_eligible: 22, n_pairs: 19, completion_rate: 86 },
  distribution: { published: false, pct_improved: null, pct_flat: null, pct_declined: null, n_declined: null },
  metrics: PREVIEW_PUBLISHED_AGGREGATES.metrics.map((m) => ({
    ...m,
    n: 19,
    published: false,
    day0_avg: null,
    week10_avg: null,
    delta_pts: null,
    delta_pct: null,
  })),
  person_deltas: [],
};
