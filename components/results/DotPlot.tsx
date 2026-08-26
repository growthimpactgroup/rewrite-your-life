import type { PublicAggregates } from "@/lib/publicAggregates";

// Change Order 01, Phase 5 — every finisher as one dot (Target F). Averages
// can hide people; this can't. Computed from REAL per-person deltas (or the
// Phase 1 preview seed in preview) — never synthesized in production. Bins
// are 2 points wide; dots stack upward within a bin.
const BIN_SIZE = 2;
const DOT_SIZE = 10;
const DOT_GAP = 3;

function bucket(delta: number): number {
  return Math.round(delta / BIN_SIZE) * BIN_SIZE;
}

function median(sortedAscending: number[]): number {
  if (sortedAscending.length === 0) return 0;
  const mid = Math.floor(sortedAscending.length / 2);
  return sortedAscending.length % 2 === 1
    ? sortedAscending[mid]
    : Math.round((sortedAscending[mid - 1] + sortedAscending[mid]) / 2);
}

function colorFor(delta: number): string {
  if (delta >= 5) return "bg-emerald-600";
  if (delta <= -5) return "bg-red-600";
  return "bg-slate-400";
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

  const bins = new Map<number, number[]>();
  for (const d of deltas) {
    const b = bucket(d);
    bins.set(b, [...(bins.get(b) ?? []), d]);
  }
  const keys = [...bins.keys()];
  const xMin = Math.min(0, ...keys) - BIN_SIZE;
  const xMax = Math.max(0, ...keys) + BIN_SIZE;
  const range = xMax - xMin || 1;
  const maxStack = Math.max(1, ...[...bins.values()].map((v) => v.length));
  const plotHeight = maxStack * (DOT_SIZE + DOT_GAP) + 12;
  const zeroLineLeft = ((0 - xMin) / range) * 100;
  const med = median(deltas);
  const zeroDeclines = n_declined === 0;

  return (
    <div className="rounded-lg border border-border bg-card px-5 py-6 sm:px-8">
      <div className="relative" style={{ height: plotHeight }}>
        <div
          className="absolute top-0 bottom-0 w-px bg-ink/30"
          style={{ left: `${zeroLineLeft}%` }}
          aria-hidden
        />
        <div className="absolute right-0 bottom-0 left-0 h-px bg-border" aria-hidden />
        {[...bins.entries()].map(([bin, vals]) => (
          <div
            key={bin}
            className="absolute bottom-0 flex -translate-x-1/2 flex-col-reverse items-center"
            style={{ left: `${((bin - xMin) / range) * 100}%`, gap: DOT_GAP }}
          >
            {vals.map((v, i) => (
              <span
                key={i}
                className={`rounded-full ${colorFor(v)}`}
                style={{ height: DOT_SIZE, width: DOT_SIZE }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="relative mt-2 h-4 text-center font-mono text-sm font-semibold text-muted">
        <span className="absolute -translate-x-1/2" style={{ left: `${zeroLineLeft}%` }}>
          no change
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4 font-mono text-base">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-600" />
          Improved (+5 pts or more) — {pct_improved}%
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-400" />
          About the same — {pct_flat}%
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-600" />
          Declined — {pct_declined}%
        </span>
      </div>

      <p className="mt-4 max-w-4xl text-lg leading-relaxed text-ink/90">
        One dot per person: their average score across all nine domains, Week 10 minus Day 0, in
        points. The typical finisher moved{" "}
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
            <span className="font-bold text-ink">Those dots are published on purpose.</span>
          </>
        )}
      </p>
    </div>
  );
}
