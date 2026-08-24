import { NextResponse } from "next/server";
import { getPublicAggregates } from "@/lib/publicAggregates";

// Cached indefinitely (no per-request DB query) until the nightly job calls
// revalidatePath('/aggregates.json') — see app/api/cron/nightly/route.ts.
// Identical figures to the /results page and /aggregates.csv, always: all
// three read from the same public_aggregates row via the same helper.
export const revalidate = false;

export async function GET() {
  try {
    const aggregates = await getPublicAggregates("ryl");

    if (!aggregates) {
      return NextResponse.json(
        { status: "collecting", message: "The nightly build has not run yet." },
        { status: 200 },
      );
    }

    return NextResponse.json(aggregates);
  } catch (err) {
    console.error("aggregates.json route error", err);
    return NextResponse.json({ error: "Could not load aggregates." }, { status: 500 });
  }
}
