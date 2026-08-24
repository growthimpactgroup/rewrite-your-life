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
    pct_improved: number;
    pct_flat: number;
    pct_declined: number;
    n_declined: number;
  };
  hygiene: {
    n_excluded_straightline: number;
  };
  metrics: Metric[];
}

/** Reads the single public_aggregates row for a course via the anon-scoped
 * client and reshapes it into the grouping /aggregates.json, /aggregates.csv,
 * and (Phase C) /results all read from — one source, so they can never
 * disagree. Returns null if the nightly job hasn't run yet for this course. */
export const getPublicAggregates = cache(async (course: string): Promise<PublicAggregates | null> => {
  const supabase = getSupabasePublicClient();

  const { data, error } = await supabase
    .from("public_aggregates")
    .select(
      "course, computed_at, measured_since, last_anchor_date, record_starts_at, total_submissions, n_started, n_pairs, completion_rate, pct_improved, pct_flat, pct_declined, n_declined, n_excluded_straightline, metrics",
    )
    .eq("course", course)
    .maybeSingle();

  if (error) {
    console.error("getPublicAggregates: query failed", error);
    throw new Error(`Could not read public_aggregates: ${error.message}`);
  }
  if (!data) return null;

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
      pct_improved: data.pct_improved,
      pct_flat: data.pct_flat,
      pct_declined: data.pct_declined,
      n_declined: data.n_declined,
    },
    hygiene: {
      n_excluded_straightline: data.n_excluded_straightline,
    },
    metrics: data.metrics,
  };
});

/** True once a human has set a real launch date — the same switch that
 * starts the public numbers' clock also lifts the "don't index yet" gate
 * (Section 10: "do not publish... until then the page runs privately on an
 * unlisted URL"). One coherent signal instead of two. */
export function isLaunched(aggregates: PublicAggregates | null): boolean {
  return aggregates?.record_starts_at != null;
}
