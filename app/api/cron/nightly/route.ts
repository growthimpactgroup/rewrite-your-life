import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

// The nightly job (Section 5 of the build spec). Scheduled by vercel.json at
// 03:00 UTC; Vercel Cron authenticates its own requests with
// `Authorization: Bearer ${CRON_SECRET}`, which also makes this the manual
// trigger for testing:
//
//   curl -H "Authorization: Bearer $CRON_SECRET" https://<deployment>/api/cron/nightly
//
// Failure behavior is load-bearing: revalidatePath is only called on
// success, so a failure here leaves yesterday's /verify.json and /results
// build serving untouched — never a broken or partial state. Loud
// failures (console.error, visible in Vercel logs), quiet success.
//
// 2026-08-28, Jeff/Frances review call — Item 2: /aggregates.json and
// /aggregates.csv are retired (now static 410s, nothing to revalidate);
// /verify.json replaces them as the thing that needs a fresh build each
// night.
export const dynamic = "force-dynamic";

const COURSE = "ryl";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    console.error("BLOCKED: CRON_SECRET is not configured");
    return NextResponse.json({ error: "Not configured." }, { status: 500 });
  }
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.rpc("refresh_public_aggregates", {
      target_course: COURSE,
    });

    if (error) {
      console.error(`BLOCKED: refresh_public_aggregates failed — ${error.message}`);
      return NextResponse.json({ error: "Refresh failed." }, { status: 500 });
    }

    const { data: row, error: readError } = await supabase
      .from("public_aggregates")
      .select("n_pairs, computed_at")
      .eq("course", COURSE)
      .maybeSingle();

    if (readError) {
      console.error(`BLOCKED: post-refresh read failed — ${readError.message}`);
      return NextResponse.json({ error: "Refresh succeeded but verification read failed." }, { status: 500 });
    }

    revalidatePath("/verify.json");
    revalidatePath("/results"); // no-op today — /results doesn't exist until Phase C

    return NextResponse.json({ ok: true, course: COURSE, ...row });
  } catch (err) {
    console.error(`BLOCKED: unexpected error — ${err instanceof Error ? err.message : String(err)}`);
    return NextResponse.json({ error: "Nightly job failed." }, { status: 500 });
  }
}
