import type { PublicAggregates } from "@/lib/publicAggregates";
import WithheldPanel from "./WithheldPanel";

// Change Order 01, Phase 1: distribution now withholds below
// PUBLISH_THRESHOLD, same as every per-metric figure — a deliberate
// supersession of the original build brief's "decliners always published
// regardless of N" rule (see supabase/schema.sql's Phase 1 comment for why).
export default function DistributionRibbon({
  distribution,
  nPairs,
}: {
  distribution: PublicAggregates["distribution"];
  nPairs: number;
}) {
  if (!distribution.published) {
    return (
      <section className="border-b border-border px-6 py-10 sm:px-10 sm:py-14">
        <p className="font-mono text-xs font-semibold tracking-widest text-muted uppercase">
          03 · Not everyone improves
        </p>
        <p className="mt-2 text-lg text-ink/90">A record with no negative results isn&apos;t a record.</p>
        <div className="mt-6">
          <WithheldPanel headline="No measure publishes until 20 people finish both maps." nSoFar={nPairs} />
        </div>
      </section>
    );
  }

  const { pct_improved, pct_flat, pct_declined, n_declined } = distribution as {
    pct_improved: number;
    pct_flat: number;
    pct_declined: number;
    n_declined: number;
  };
  const zeroDeclines = n_declined === 0;

  return (
    <section className="border-b border-border px-6 py-10 sm:px-10 sm:py-14">
      <p className="font-mono text-xs font-semibold tracking-widest text-muted uppercase">
        03 · Not everyone improves
      </p>
      <p className="mt-2 text-lg text-ink/90">A record with no negative results isn&apos;t a record.</p>

      {/* All three segments always render, even at 0% — a record whose own
          "we publish declines honestly" section can make the declined
          bucket visually disappear isn't actually honest. Each gets a
          guaranteed minimum width (flex-basis) so its label is always
          legible; flex-grow above that floor is proportional to the real
          percentage. Zero-decline rule (Change Order 01, Phase 1): the
          number itself is never printed as a bare "0%" stat — see below. */}
      <div className="mt-6 flex h-16 w-full overflow-hidden rounded-md border border-ink/10 font-mono text-sm font-semibold text-white">
        <div
          className="flex flex-col items-center justify-center bg-emerald-700"
          style={{ flexGrow: pct_improved, flexShrink: 1, flexBasis: "64px" }}
        >
          <span>{pct_improved}%</span>
          <span className="text-[10px] font-normal tracking-widest uppercase opacity-90">Improved</span>
        </div>
        <div
          className="flex flex-col items-center justify-center bg-slate-400"
          style={{ flexGrow: pct_flat, flexShrink: 1, flexBasis: "64px" }}
        >
          <span>{pct_flat}%</span>
          <span className="text-[10px] font-normal tracking-widest uppercase opacity-90">Flat</span>
        </div>
        <div
          className="flex flex-col items-center justify-center bg-red-700"
          style={{ flexGrow: zeroDeclines ? 0.001 : pct_declined, flexShrink: 1, flexBasis: "64px" }}
        >
          <span>{zeroDeclines ? "—" : `${pct_declined}%`}</span>
          <span className="text-[10px] font-normal tracking-widest uppercase opacity-90">Declined</span>
        </div>
      </div>

      <p className="mt-5 text-sm text-ink/80">
        Improved = average domain score up 5 points or more · Flat = within ±5 · Declined = down 5 or
        more.
      </p>
      {zeroDeclines ? (
        <p className="mt-2 font-bold text-ink">
          No finisher has declined so far — and the day one does, that number publishes too.
        </p>
      ) : (
        <p className="mt-2 font-bold text-ink">
          {n_declined} of {nPairs} finishers rated themselves lower at Week 10 than at Day 0. That
          number is published on purpose.
        </p>
      )}
    </section>
  );
}
