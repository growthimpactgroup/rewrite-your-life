import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { TOTAL_QUESTIONS } from "@/lib/questions";
import { isValidEmailFormat, normalizeEmail } from "@/lib/email";

// Read-only lookup for a person's own prior submissions, used to build the
// retake/week-10 before-after comparison, and (EmailScreen) an early check
// for whether a typo'd or duplicate email is about to break continuity.
// POST only, on purpose — email is personal data and must never travel in a
// URL or query string. This route never writes anything; the insert-only
// guarantee on assessment_responses (see app/api/submit/route.ts) is
// unaffected by adding a read path here.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;

  if (b.course !== "ryl") {
    return NextResponse.json({ error: "Invalid course." }, { status: 400 });
  }
  if (typeof b.email !== "string" || !isValidEmailFormat(b.email.trim())) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }

  const email = normalizeEmail(b.email);

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("assessment_responses")
      .select("*")
      .eq("course", "ryl")
      .eq("email", email)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase results lookup failed", error);
      return NextResponse.json({ error: "Could not load prior results." }, { status: 500 });
    }

    const submissions = (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      const items = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => {
        const value = r[`item_${i + 1}`];
        return typeof value === "number" ? value : Number(value);
      });
      return {
        createdAt: r.created_at as string,
        phase: r.phase as string,
        items,
        unmatchedRetake: Boolean(r.unmatched_retake),
      };
    });

    return NextResponse.json({ submissions });
  } catch (err) {
    console.error("Results route error", err);
    return NextResponse.json({ error: "Server is not configured yet." }, { status: 500 });
  }
}
