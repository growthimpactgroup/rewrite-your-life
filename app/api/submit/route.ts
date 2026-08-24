import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { TOTAL_QUESTIONS } from "@/lib/questions";
import { isValidEmailFormat, normalizeEmail } from "@/lib/email";

// Insert-only, on purpose: this file exports POST and nothing else. There is
// no PATCH/PUT/DELETE handler here or anywhere else in the app — rows in
// assessment_responses can never be edited or removed through the app.
export const dynamic = "force-dynamic";

const VALID_PHASES = new Set(["first", "retake", "week10"]);
// The five-button scale only ever produces one of these values.
const VALID_ITEM_VALUES = new Set([0, 3, 5, 8, 10]);

interface SubmitPayload {
  course: string;
  phase: string;
  email: string;
  items: number[];
  consent: true;
}

function validate(
  body: unknown,
): { ok: true; data: SubmitPayload } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid request body." };
  }
  const b = body as Record<string, unknown>;

  if (b.course !== "ryl") {
    return { ok: false, error: "Invalid course." };
  }
  if (typeof b.phase !== "string" || !VALID_PHASES.has(b.phase)) {
    return { ok: false, error: "Invalid phase." };
  }
  if (
    typeof b.email !== "string" ||
    b.email.trim().length === 0 ||
    b.email.length > 320 ||
    !isValidEmailFormat(b.email.trim())
  ) {
    return { ok: false, error: "Invalid email." };
  }
  if (
    !Array.isArray(b.items) ||
    b.items.length !== TOTAL_QUESTIONS ||
    !b.items.every((v) => typeof v === "number" && VALID_ITEM_VALUES.has(v))
  ) {
    return { ok: false, error: "Invalid answers." };
  }
  if (b.consent !== true) {
    return { ok: false, error: "Consent is required." };
  }

  return {
    ok: true,
    data: {
      course: b.course,
      phase: b.phase,
      email: normalizeEmail(b.email),
      items: b.items as number[],
      consent: true,
    },
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const result = validate(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const { course, phase, email, items, consent } = result.data;

  const row: Record<string, unknown> = { course, phase, email, consent };
  items.forEach((value, i) => {
    row[`item_${i + 1}`] = value;
  });

  try {
    const supabase = getSupabaseServerClient();

    // Unmatched retake: accept and store the row regardless — never block or
    // ask the person to prove they were here before. Just flag it for the
    // weekly hygiene pass so it doesn't silently look like a paired retake.
    if (phase !== "first") {
      const { count } = await supabase
        .from("assessment_responses")
        .select("id", { count: "exact", head: true })
        .eq("course", course)
        .eq("email", email);
      row.unmatched_retake = !count || count === 0;
    }

    const { data, error } = await supabase
      .from("assessment_responses")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert failed", error);
      return NextResponse.json(
        { error: "Could not save your responses." },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    console.error("Submit route error", err);
    return NextResponse.json(
      { error: "Server is not configured yet." },
      { status: 500 },
    );
  }
}
