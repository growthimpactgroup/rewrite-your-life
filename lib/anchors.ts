import { readFileSync } from "fs";
import { join } from "path";

// The monthly anchor (Section 9) is a manual, filesystem-based step —
// Frances files the .ots proof into public/proofs and updates this manifest
// by hand. Not database-driven: this is the one source of truth for anchor
// data, read by both the embedded chain on /results and the full /proofs
// page, so the two can never disagree.

export interface Anchor {
  date: string; // YYYY-MM-DD
  row_count: number;
  sha256: string;
  file: string; // filename inside public/proofs/, e.g. "ryl_raw_2026-09.csv.ots"
}

const MANIFEST_PATH = join(process.cwd(), "public", "proofs", "anchors.json");

export function getAnchors(): Anchor[] {
  let raw: string;
  try {
    raw = readFileSync(MANIFEST_PATH, "utf-8");
  } catch {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    console.error("getAnchors: anchors.json is not valid JSON", err);
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return (parsed as Anchor[])
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getLatestAnchor(): Anchor | null {
  const anchors = getAnchors();
  return anchors[0] ?? null;
}
