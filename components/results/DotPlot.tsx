import type { PublicAggregates } from "@/lib/publicAggregates";

// Change Order 01, Phase 5 — every finisher sorted into a group. Averages
// can hide people; a per-person breakdown can't.
//
// 2026-08-28, Jeff/Frances review call — Item 9: neither reviewer could
// read the original bin/scatter dot plot ("I have no idea what that
// means") — an unlabeled points axis with dots stacked in bins asked too
// much of a first-time reader. Replaced with three square data blocks
// (same visual language as Item 6's fix to the domain rows): a plain
// percentage and count for each of the three groups, computed from the
// same real per-person deltas as before — nothing here is synthesized.
function median(sortedAscending: number[]): number {
  if (sortedAscending.length === 0) return 0;
  const mid = Math.floor(sortedAscending.length / 2);
  return sortedAscending.length % 2 === 1
    ? sortedAscending[mid]
    : Math.round((sortedAscending[mid - 1] + sortedAscending[mid]) / 2);
}

export default function DotPlot({
  deltas,
  distribution,
  nPairs,
}: {
  deltas: number[];
  distribution: PublicAggregates["distribution"];
  nPairs: number;
}) {
  const { pct_improved, pct_flat, pct_declined, n_declined } = distribution as {
    pct_improved: number;
    pct_flat: number;
    pct_declined: number;
    n_declined: number;
  };

  const nImproved = deltas.filter((d) => d >= 5).length;
  const nFlat = deltas.filter((d) => d > -5 && d < 5).length;
  const sorted = [...deltas].sort((a, b) => a - b);
  const med = median(sorted);
  const zeroDeclines = n_declined === 0;

  const groups = [
    {
      label: "Improved",
      pct: pct_improved,
      n: nImproved,
      detail: "gained 5 points or more",
      border: "border-emerald-800",
    },
    {
      label: "About the same",
      pct: pct_flat,
      n: nFlat,
      detail: "moved less than 5 points either way",
      border: "border-slate-400",
    },
    {
      label: "Declined",
      pct: pct_declined,
      n: n_declined,
      detail: "dropped 5 points or more",
      border: "border-red-600",
    },
  ];

  return (
    <div className="rounded-lg border border-border bg-card px-5 py-6 sm:px-8">
      <p className="max-w-4xl text-lg leading-relaxed text-ink/90">
        Every one of the {nPairs} finishers, sorted into three groups by how much their average score
        across all nine domains moved from Day 0 to Week 10.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {groups.map((g) => (
          <div key={g.label} className={`rounded-lg border-t-4 ${g.border} bg-surface px-5 py-6`}>
            <div className="text-4xl font-bold text-ink">{g.pct}%</div>
            <div className="mt-1 font-mono text-sm font-semibold tracking-widest text-muted uppercase">
              {g.label}
            </div>
            <p className="mt-2 text-base text-ink/90">
              {g.n} of {nPairs} people {g.detail}.
            </p>
          </div>
        ))}
      </div>

      <p className="mt-6 max-w-4xl text-lg leading-relaxed text-ink/90">
        The typical finisher moved{" "}
        <span className="font-bold text-ink">
          {med >= 0 ? "+" : ""}
          {med} points
        </span>
        .{" "}
        {zeroDeclines ? (
          "No finisher declined — that number publishes here too, the day one does."
        ) : (
          <>
            {n_declined} of {nPairs} finishers declined.{" "}
            <span className="font-bold text-ink">Those numbers are published on purpose.</span>
          </>
        )}
      </p>
    </div>
  );
}
