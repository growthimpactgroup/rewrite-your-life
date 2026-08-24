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
