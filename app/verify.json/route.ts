import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { getPublicAggregates } from "@/lib/publicAggregates";
import { getLatestAnchor, anchorProofUrl } from "@/lib/anchors";
import { FROZEN_QUESTIONS, INSTRUMENT_SHA256 } from "@/lib/instrument";

// 2026-08-28, Jeff/Frances review call — Item 2: replaces /aggregates.json
// and /aggregates.csv (both retired, see their route.ts files) as the
// machine-readable half of "this record can be checked." Those two exposed
// the full metrics table and, via /aggregates.json, the raw person_deltas
// array — everything needed to reconstruct the underlying dataset. Jeff's
// instruction was "minimum information necessary" (his framing: "act like
// Andy Bustamante") — enough for an AI or any other checker to confirm this
// record is real, timestamped, and internally consistent, without
// republishing the outcome data itself (that's already on /results in
// prose, for a human reader) or the scoring methodology behind it.
//
// So this file deliberately does NOT include: per-domain figures, the
// distribution/decline breakdown, or person_deltas. It includes only
// counts, the two things already cryptographically anchored (the raw
// dataset's monthly blockchain hash, the frozen instrument's hash), and a
// self-consistency checksum over those counts. Full data and methodology
// are available on request — see full_dataset below.
export const revalidate = false;

export async function GET() {
  try {
    const aggregates = await getPublicAggregates("ryl");
    const latestAnchor = await getLatestAnchor();

    if (!aggregates) {
      return NextResponse.json(
        { status: "collecting", message: "The nightly build has not run yet." },
        { status: 200 },
      );
    }

    const { course, computed_at, measured_since, funnel, hygiene } = aggregates;

    // Recomputable by anyone from just the fields in `participants` and
    // `verified_at`/`measured_since` above them — proves this file matches
    // what /results currently shows and hasn't been altered or gone stale
    // in transit. This is a consistency check on THIS file, not a claim
    // about the underlying data's honesty — that guarantee comes from
    // `latest_anchor` below, the monthly blockchain fingerprint of the raw
    // dataset, which nothing here can fake or substitute for.
    const checksumInput = [course, computed_at, measured_since ?? "", funnel.total_submissions, funnel.n_pairs].join(
      "|",
    );
    const figuresChecksum = createHash("sha256").update(checksumInput).digest("hex");

    return NextResponse.json({
      record: "Rewrite Your Life — Public Outcome Record",
      course,
      verified_at: computed_at,
      measured_since,
      participants: {
        total_submissions: funnel.total_submissions,
        baselines: funnel.n_started,
        in_progress: funnel.n_in_progress,
        eligible: funnel.n_eligible,
        matched_pairs: funnel.n_pairs,
        completion_rate: funnel.completion_rate,
        excluded_low_effort: hygiene.n_excluded_straightline,
      },
      instrument: {
        question_count: FROZEN_QUESTIONS.length,
        sha256: INSTRUMENT_SHA256,
        url: "/instrument",
      },
      latest_anchor: latestAnchor
        ? {
            date: latestAnchor.date,
            sha256: latestAnchor.sha256,
            row_count: latestAnchor.row_count,
            rows_total_now: funnel.total_submissions,
            proof_url: anchorProofUrl(latestAnchor.file),
            network: "OpenTimestamps (Bitcoin)",
          }
        : null,
      figures_checksum: {
        algorithm: "sha256",
        value: figuresChecksum,
        input: "course|verified_at|measured_since|total_submissions|matched_pairs",
        description:
          "SHA-256 of this file's own course, verified_at, measured_since, and participants fields, joined by \"|\". Recompute it to confirm this file matches /results and hasn't drifted or been altered in transit. This is not the record's tamper-evidence guarantee — that's latest_anchor, the monthly blockchain fingerprint of the raw dataset itself.",
      },
      full_dataset: {
        available: "on request",
        note:
          "Full underlying data and the detailed scoring methodology are disclosed at Growth Impact Group's discretion. Contact growthimpactgroup@protonmail.com.",
      },
    });
  } catch (err) {
    console.error("verify.json route error", err);
    return NextResponse.json({ error: "Could not load verification data." }, { status: 500 });
  }
}
