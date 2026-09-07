import { NextResponse } from "next/server";

// 2026-08-28, Jeff/Frances review call — Item 2: retired. This used to
// return the full metrics table and the raw person_deltas array (one
// value per finished pair) — everything needed to reconstruct the
// underlying dataset. Jeff's instruction was to stop offering that as a
// free download; /verify.json is the new minimal, structured endpoint,
// scoped to counts and cryptographic proof rather than outcome data.
// Kept as a 410 (not a bare 404) so anything that had this URL bookmarked
// or linked gets an explanation instead of a silent failure.
export const revalidate = false;

export async function GET() {
  return NextResponse.json(
    {
      status: "retired",
      message:
        "This endpoint no longer publishes the full dataset. See /verify.json for structured verification data, or /results for the published figures. Full underlying data is available on request, at Growth Impact Group's discretion — contact growthimpactgroup@protonmail.com.",
    },
    { status: 410 },
  );
}
