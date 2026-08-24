import { cache } from "react";
import { getSupabasePublicClient } from "./supabasePublic";

export interface Metric {
  key: string;
  label: string;
  type: "domain" | "anchor";
  day0_avg: number | null;
  week10_avg: number | null;
  delta_pts: number | null;
  delta_pct: number | null;
  n: number;
  published: boolean;
}

export interface PublicAggregates {
  course: string;
  computed_at: string;
  measured_since: string | null;
  last_anchor_date: string | null;
  /** Null until a human sets a real launch date (see supabase/schema.sql's
   * "Launch cutoff date" block). Doubles as the public pages' index/noindex
   * gate — see isLaunched() below — so there's one switch, not two. */
  record_starts_at: string | null;
  funnel: {
    total_submissions: number;
    n_started: number;
    n_pairs: number;
    completion_rate: number;
  };
  distribution: {
    /** Change Order 01, Phase 1: distribution now withholds below
     * PUBLISH_THRESHOLD too — this supersedes the original build brief's
     * "decliners always published regardless of N" rule. Below threshold,
     * every field here is null; nothing renders. */
    published: boolean;
    pct_improved: number | null;
    pct_flat: number | null;
    pct_declined: number | null;
    n_declined: number | null;
  };
  hygiene: {
    n_excluded_straightline: number;
  };
  metrics: Metric[];
  /** Values-only per-person average domain deltas, one per finished pair —
   * empty until distribution.published is true. Same scrub-at-source
   * discipline as everything else here. */
  person_deltas: number[];
}

/** Reads the single public_aggregates row for a course via the anon-scoped
 * client and reshapes it into the grouping /aggregates.json, /aggregates.csv,
 * and /results all read from — one source, so they can never disagree.
 * Returns null if the nightly job hasn't run yet for this course.
 *
 * Change Order 01, Phase 1: this is also the ONE place that scrubs
 * below-threshold figures to null before they leave the server. Previously
 * only the page component checked metric.published before rendering —
 * /aggregates.json passed the raw day0_avg/week10_avg/delta_pts/delta_pct
 * through unscrubbed even when published=false, a real live leak (see
 * schema.sql's Phase 1 comment). Scrubbing here, once, means every current
 * and future consumer (page, JSON feed, CSV, JSON-LD) gets the safe version
 * automatically — it's structurally impossible to leak by forgetting a
 * published check somewhere new. */
export const getPublicAggregates = cache(async (course: string): Promise<PublicAggregates | null> => {
  const supabase = getSupabasePublicClient();

  const { data, error } = await supabase
    .from("public_aggregates")
    .select(
      "course, computed_at, measured_since, last_anchor_date, record_starts_at, total_submissions, n_started, n_pairs, completion_rate, distribution_published, pct_improved, pct_flat, pct_declined, n_declined, n_excluded_straightline, metrics, person_deltas",
    )
    .eq("course", course)
    .maybeSingle();

  if (error) {
    console.error("getPublicAggregates: query failed", error);
    throw new Error(`Could not read public_aggregates: ${error.message}`);
  }
  if (!data) return null;

  // n itself is never sensitive on its own — kept as-is regardless of
  // published, same as the spec's own "Collecting — currently n=X" copy.
  const rawMetrics = (data.metrics ?? []) as Metric[];
  const metrics: Metric[] = rawMetrics.map((m) => ({
    ...m,
    day0_avg: m.published ? m.day0_avg : null,
    week10_avg: m.published ? m.week10_avg : null,
    delta_pts: m.published ? m.delta_pts : null,
    delta_pct: m.published ? m.delta_pct : null,
  }));

  const distributionPublished = Boolean(data.distribution_published);

  return {
    course: data.course,
    computed_at: data.computed_at,
    measured_since: data.measured_since,
    last_anchor_date: data.last_anchor_date,
    record_starts_at: data.record_starts_at,
    funnel: {
      total_submissions: data.total_submissions,
      n_started: data.n_started,
      n_pairs: data.n_pairs,
      completion_rate: data.completion_rate,
    },
    distribution: {
      published: distributionPublished,
      pct_improved: distributionPublished ? data.pct_improved : null,
      pct_flat: distributionPublished ? data.pct_flat : null,
      pct_declined: distributionPublished ? data.pct_declined : null,
      n_declined: distributionPublished ? data.n_declined : null,
    },
    hygiene: {
      n_excluded_straightline: data.n_excluded_straightline,
    },
    metrics,
    person_deltas: distributionPublished ? ((data.person_deltas ?? []) as number[]) : [],
  };
});

/** True once a human has set a real launch date — the same switch that
 * starts the public numbers' clock also lifts the "don't index yet" gate
 * (Section 10: "do not publish... until then the page runs privately on an
 * unlisted URL"). One coherent signal instead of two. */
export function isLaunched(aggregates: PublicAggregates | null): boolean {
  return aggregates?.record_starts_at != null;
}
