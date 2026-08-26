import { PUBLISH_THRESHOLD } from "@/lib/publishThreshold";

// Target E (Change Order 01, Phases 1 and 4) — shared between the
// distribution section and the change-visuals section. Reads as a rule
// being kept against our own interest, not a broken page.
export default function WithheldPanel({
  headline,
  nSoFar,
}: {
  headline: string;
  nSoFar: number;
}) {
  const pct = Math.min(100, Math.round((nSoFar / PUBLISH_THRESHOLD) * 100));

  return (
    <div className="rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
      <p className="font-mono text-sm font-semibold tracking-widest text-primary uppercase">
        Withheld · Privacy threshold
      </p>
      <p className="mt-3 text-2xl font-bold text-ink">{headline}</p>
      <p className="mx-auto mt-3 max-w-md text-base text-ink/80">
        Below that, group averages can expose an individual. Every measure is computed nightly and
        stored — it is simply not shown until the threshold is met.
      </p>
      <div className="mx-auto mt-6 h-3 max-w-md overflow-hidden rounded-sm border border-ink/20 bg-surface">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <div className="mx-auto mt-2 flex max-w-md justify-between font-mono text-sm font-semibold text-muted">
        <span>{nSoFar} finished so far</span>
        <span>publishes at {PUBLISH_THRESHOLD}</span>
      </div>
    </div>
  );
}
