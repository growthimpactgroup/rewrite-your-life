// Section 3's display standard: percentage → percentage · points (relative
// %), always in that order, relative change always in parentheses, always
// second. Anchors show raw values + delta, one decimal, no percentage.

function signed(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

/** "+19 pts (+37%)" or "+1.7 (+31%)" for anchors (no "pts" suffix). Falls
 * back to points-only when delta_pct is null (day0_avg was 0 — can't take a
 * relative change of zero). */
export function formatDelta(deltaPts: number, deltaPct: number | null, unit: "pts" | "" = "pts"): string {
  const ptsLabel = unit === "pts" ? `${signed(deltaPts)} pts` : signed(deltaPts);
  return deltaPct === null ? ptsLabel : `${ptsLabel} (${signed(deltaPct)}%)`;
}

export function formatPercent(n: number): string {
  return `${n}%`;
}

// "8", "11", "18", and "80"-"89" are the only leading numbers in this
// range whose spoken form starts with a vowel sound (eight, eleven,
// eighteen, eighty-X) and so need "an" instead of "a".
function articleFor(n: number): "a" | "an" {
  return n === 8 || n === 11 || n === 18 || (n >= 80 && n <= 89) ? "an" : "a";
}

/** "35% to 82% — a 135% increase." Percentage-only phrasing (no "pts"),
 * for a reader who's never seen this page before. Falls back to just the
 * before/after when deltaPct is null (day0Avg was 0 — no relative percent
 * to take). */
export function formatPercentChange(day0: number, week10: number, deltaPct: number | null): string {
  const base = `${day0}% to ${week10}%`;
  if (deltaPct === null) return `${base}.`;
  if (deltaPct === 0) return `${base} — no change.`;
  const abs = Math.abs(deltaPct);
  const direction = deltaPct > 0 ? "increase" : "decrease";
  return `${base} — ${articleFor(abs)} ${abs}% ${direction}.`;
}

export function formatAnchorValue(n: number): string {
  return n.toFixed(1);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  return (
    new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) +
    ", " +
    new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }) +
    " UTC"
  );
}
