import { getSupabaseServerClient } from "@/lib/supabaseServer";

// Section 9, Step 1 — the only way to pull raw submissions (emails +
// individual answers) out of the system. The most sensitive route in this
// app: never linked from any public page, never cached, gated by a bearer
// token that lives only in .env.local / Vercel project env vars.
//
//   curl -H "Authorization: Bearer $ADMIN_EXPORT_TOKEN" \
//     "https://<deployment>/api/admin/export?month=2026-09" -o ryl_raw_2026-09.csv
//
// `month` (optional, YYYY-MM) scopes the export to one calendar month,
// matching Section 9's "ryl_raw_YYYY-MM.csv" filing convention. Omit it to
// export everything.
export const dynamic = "force-dynamic";

const COURSE = "ryl";
const ITEM_COLUMNS = Array.from({ length: 27 }, (_, i) => `item_${i + 1}`);
const COLUMNS = ["id", "created_at", "course", "phase", "email", ...ITEM_COLUMNS, "consent", "unmatched_retake"];

function csvField(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function monthBounds(month: string): { start: string; end: string } | null {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return null;
  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1; // 0-based
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.ADMIN_EXPORT_TOKEN;

  if (!expected) {
    console.error("BLOCKED: ADMIN_EXPORT_TOKEN is not configured");
    return new Response("Not configured.", { status: 500 });
  }
  if (authHeader !== `Bearer ${expected}`) {
    return new Response("Unauthorized.", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  let bounds: { start: string; end: string } | null = null;
  if (month) {
    bounds = monthBounds(month);
    if (!bounds) {
      return new Response("Invalid month — expected YYYY-MM.", { status: 400 });
    }
  }

  try {
    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("assessment_responses")
      .select("*")
      .eq("course", COURSE)
      .order("created_at", { ascending: true });

    if (bounds) {
      query = query.gte("created_at", bounds.start).lt("created_at", bounds.end);
    }

    const { data, error } = await query;

    if (error) {
      console.error("admin export query failed", error.message);
      return new Response("Export failed.", { status: 500 });
    }

    const rows = (data ?? []).map((row) =>
      COLUMNS.map((col) => csvField((row as Record<string, unknown>)[col])).join(","),
    );
    const csv = [COLUMNS.join(","), ...rows].join("\n") + "\n";
    const filename = month ? `ryl_raw_${month}.csv` : "ryl_raw_all.csv";

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("admin export route error", err instanceof Error ? err.message : String(err));
    return new Response("Export failed.", { status: 500 });
  }
}
