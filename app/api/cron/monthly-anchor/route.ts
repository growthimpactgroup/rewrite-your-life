import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createHash } from "crypto";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

// Runs on the 1st of each month at 3 AM UTC (configured in vercel.json)
// Creates a snapshot of the full raw dataset, hashes it, and timestamps it on Bitcoin
// via OpenTimestamps. The .ots proof is stored in supabase storage at /proofs

export const maxDuration = 300; // 5 min timeout

export async function GET(req: Request) {
  // Verify this is a real cron request from Vercel
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseServerClient();

    // 1. Export full raw dataset as CSV
    const { data: rows, error } = await supabase
      .from("assessment_responses")
      .select("*")
      .order("created_at", { ascending: true });

    if (error || !rows) {
      console.error("Failed to fetch raw data:", error);
      return NextResponse.json({ error: "Data export failed" }, { status: 500 });
    }

    // 2. Convert to CSV (all columns, all rows)
    const headers = Object.keys(rows[0] || {});
    const csvLines = [headers.join(",")];
    for (const row of rows) {
      const values = headers.map((h) => {
        const v = (row as Record<string, unknown>)[h];
        if (v === null) return "";
        if (typeof v === "string") return `"${v.replace(/"/g, '""')}"`;
        return String(v);
      });
      csvLines.push(values.join(","));
    }
    const csvContent = csvLines.join("\n");

    // 3. Compute SHA-256 hash
    const dataHash = createHash("sha256").update(csvContent).digest("hex");
    const anchorDate = new Date().toISOString();

    // 4. Submit to OpenTimestamps for Bitcoin anchoring. "a.opentimestamps.org"
    // was never a real host (getaddrinfo ENOTFOUND, discovered 2026-09-22) —
    // the actual public calendar servers are alice/bob.opentimestamps.org.
    // Alice first, Bob as a fallback if Alice is unreachable, so a single
    // calendar server having a bad day doesn't block the monthly anchor.
    const OTS_CALENDARS = [
      "https://alice.opentimestamps.org",
      "https://bob.opentimestamps.org",
    ];

    let otsResponse: Response | null = null;
    let lastStatus: number | string = "no calendar reachable";
    for (const calendarUrl of OTS_CALENDARS) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      try {
        const res = await fetch(calendarUrl, {
          method: "POST",
          body: Buffer.from(dataHash, "hex"),
          headers: { "Content-Type": "application/octet-stream" },
          signal: controller.signal,
        });
        if (res.ok) {
          otsResponse = res;
          break;
        }
        lastStatus = res.status;
      } catch (err) {
        lastStatus = err instanceof Error ? err.message : String(err);
      } finally {
        clearTimeout(timeoutId);
      }
    }

    if (!otsResponse) {
      console.error("OpenTimestamps submission failed:", lastStatus);
      return NextResponse.json({ error: "OTS submission failed" }, { status: 500 });
    }

    const proofBuffer = await otsResponse.arrayBuffer();
    const proofFilename = `ryl_${anchorDate.split("T")[0]}.ots`;

    // 5. Upload proof to supabase storage
    const { error: uploadError } = await supabase.storage
      .from("proofs")
      .upload(proofFilename, proofBuffer, { upsert: true });

    if (uploadError) {
      console.error("Proof upload failed:", uploadError);
      return NextResponse.json({ error: "Proof upload failed" }, { status: 500 });
    }

    // 6. Write the JSON sidecar lib/anchors.ts reads to list anchors — see
    // that file's header comment for why this lives in Storage rather than
    // public/proofs/anchors.json (a cron function can't write into public/).
    const sidecarFilename = `ryl_${anchorDate.split("T")[0]}.json`;
    const sidecar = {
      date: anchorDate.split("T")[0],
      row_count: rows.length,
      sha256: dataHash,
      file: proofFilename,
    };
    const { error: sidecarError } = await supabase.storage
      .from("proofs")
      .upload(sidecarFilename, JSON.stringify(sidecar), {
        upsert: true,
        contentType: "application/json",
      });
    if (sidecarError) {
      console.error("Anchor sidecar upload failed:", sidecarError);
      return NextResponse.json({ error: "Anchor sidecar upload failed" }, { status: 500 });
    }

    console.log(`Monthly anchor created: ${proofFilename}, hash=${dataHash}, rows=${rows.length}`);

    // /proofs, /results, and /verify.json all render from getAnchors(), and
    // all three are statically generated (revalidate = false) — without
    // this, a new anchor sits in Storage but stays invisible until the next
    // unrelated deploy happens to rebuild them.
    revalidatePath("/proofs");
    revalidatePath("/results");
    revalidatePath("/verify.json");

    return NextResponse.json({
      success: true,
      anchor: {
        date: anchorDate,
        hash: dataHash,
        rows_anchored: rows.length,
        proof_file: proofFilename,
        network: "Bitcoin (via OpenTimestamps)",
      },
    });
  } catch (err) {
    console.error("Monthly anchor error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
