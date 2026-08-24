import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

// Decline path (Section 6 of the build spec): writes only a bare tally to
// decline_log — no answers, no email, no identifiers. assessment_responses
// is never touched from this route.
export const dynamic = "force-dynamic";

const VALID_PHASES = new Set(["first", "retake", "week10"]);

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
  if (typeof b.phase !== "string" || !VALID_PHASES.has(b.phase)) {
    return NextResponse.json({ error: "Invalid phase." }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("decline_log")
      .insert({ course: b.course, phase: b.phase });

    if (error) {
      console.error("Supabase decline_log insert failed", error);
      return NextResponse.json({ error: "Could not log decline." }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("Decline route error", err);
    return NextResponse.json({ error: "Server is not configured yet." }, { status: 500 });
  }
}
