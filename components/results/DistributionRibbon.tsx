import type { PublicAggregates } from "@/lib/publicAggregates";
import WithheldPanel from "./WithheldPanel";
import DotPlot from "./DotPlot";
import SectionHeading from "./SectionHeading";

// Change Order 01, Phase 1: distribution now withholds below
// PUBLISH_THRESHOLD, same as every per-metric figure — a deliberate
// supersession of the original build brief's "decliners always published
// regardless of N" rule (see supabase/schema.sql's Phase 1 comment for why).
//
// Change Order 01, Phase 5: the visualization itself is now every finisher
// as one dot (DotPlot, Target F) rather than a single segmented bar — the
// bar could show an honest 7% without a reader ever seeing that it's six
// real people.
export default function DistributionRibbon({
  distribution,
  nPairs,
  personDeltas,
}: {
  distribution: PublicAggregates["distribution"];
  nPairs: number;
  personDeltas: number[];
}) {
  return (
    <section className="border-b border-border px-6 py-10 sm:px-10 sm:py-14">
      <SectionHeading eyebrow="03 · Not everyone improves" title="Not Everyone Improves" />
      <p className="mt-2 text-lg text-ink/90">A record with no negative results isn&apos;t a record.</p>
      <div className="mt-6">
        {distribution.published ? (
          <DotPlot deltas={personDeltas} distribution={distribution} nPairs={nPairs} />
        ) : (
          <WithheldPanel headline="No measure publishes until 20 people finish both maps." nSoFar={nPairs} />
        )}
      </div>
    </section>
  );
}
