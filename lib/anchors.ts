import { getSupabaseServerClient } from "./supabaseServer";

// The monthly anchor (Section 9) used to be a manual, filesystem-based step
// (Frances filing the .ots proof into public/proofs and hand-editing
// anchors.json). That stopped being the source of truth once
// app/api/cron/monthly-anchor automated filing — a serverless cron function
// can upload to Supabase Storage, but it can never write into public/,
// which is baked into the build at deploy time. So the manifest now lives
// in the same "proofs" Storage bucket the cron writes to: one small JSON
// sidecar per anchor, named to match its .ots file, read here by listing
// the bucket. This is the one source of truth for anchor data, read by the
// embedded chain on /results, the full /proofs page, and /verify.json, so
// none of them can ever disagree.

export interface Anchor {
  date: string; // YYYY-MM-DD
  row_count: number;
  sha256: string;
  file: string; // filename inside the "proofs" Storage bucket, e.g. "ryl_2026-09-22.ots"
}

const BUCKET = "proofs";

/** Public download URL for a proof file living in the "proofs" bucket. */
export function anchorProofUrl(filename: string): string {
  const supabaseUrl = process.env.SUPABASE_URL ?? "";
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${filename}`;
}

export async function getAnchors(): Promise<Anchor[]> {
  try {
    const supabase = getSupabaseServerClient();
    const { data: files, error } = await supabase.storage.from(BUCKET).list("");
    if (error || !files) return [];

    const sidecars = files.filter((f) => f.name.endsWith(".json"));
    const anchors: Anchor[] = [];

    for (const f of sidecars) {
      const { data: blob, error: downloadError } = await supabase.storage
        .from(BUCKET)
        .download(f.name);
      if (downloadError || !blob) continue;
      try {
        const parsed = JSON.parse(await blob.text()) as Anchor;
        if (parsed.date && parsed.sha256 && parsed.file) anchors.push(parsed);
      } catch {
        continue;
      }
    }

    return anchors.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  } catch (err) {
    console.error("getAnchors: failed to read from storage", err);
    return [];
  }
}

export async function getLatestAnchor(): Promise<Anchor | null> {
  const anchors = await getAnchors();
  return anchors[0] ?? null;
}
