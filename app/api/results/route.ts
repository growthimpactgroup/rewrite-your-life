import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { TOTAL_QUESTIONS } from "@/lib/questions";
import { isValidEmailFormat, normalizeEmail } from "@/lib/email";
import { isValidCode, normalizeCode } from "@/lib/participantCode";

// Read-only lookup for a person's own prior submissions, used to build the
// retake/week-10 before-after comparison, and (EmailScreen) an early check
// for whether a mistyped or duplicate private code is about to break
// continuity. Looked up by private code, or by the legacy email of someone
// who started before the code existed. POST only, on purpose — an identifier
// must never travel in a URL or query string. This route never writes anything; the insert-only
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

  let column: "participant_code" | "email";
  let value: string;
  if (typeof b.code === "string") {
    if (!isValidCode(b.code)) {
      return NextResponse.json({ error: "Invalid private code." }, { status: 400 });
    }
    column = "participant_code";
    value = normalizeCode(b.code);
  } else if (typeof b.email === "string" && isValidEmailFormat(b.email.trim())) {
    column = "email";
    value = normalizeEmail(b.email);
  } else {
    return NextResponse.json({ error: "Invalid private code." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("assessment_responses")
      .select("*")
      .eq("course", "ryl")
      .eq(column, value)
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
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        error: "Server error loading results. " + errorMsg,
        hint: "If this mentions missing environment variables, see FIX_RESULTS_API.md"
      },
      { status: 500 }
    );
  }
}
