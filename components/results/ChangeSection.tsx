import type { Metric } from "@/lib/publicAggregates";
import ChangeChart from "./ChangeChart";
import LifeAnchorCards from "./LifeAnchorCards";
import WithheldPanel from "./WithheldPanel";
import { BLOCK_2_RESULTS_DISCLOSURE } from "@/lib/copyBlocks";
import SectionHeading from "./SectionHeading";

// Change Order 01, Phase 4 — section 02. One shared withheld state (Target
// E) for the whole section below threshold, not a separate panel per
// sub-component — chart and cards publish or withhold together, since
// they're gated by the same n_pairs >= PUBLISH_THRESHOLD condition.
export default function ChangeSection({ metrics, nPairs }: { metrics: Metric[]; nPairs: number }) {
  const published = metrics.some((m) => m.type === "domain" && m.published);

  return (
    <section className="border-b border-border px-6 py-10 sm:px-10 sm:py-14">
      <SectionHeading eyebrow="02 · What moved in ten weeks" title="What Moved in Ten Weeks" />
      <p className="mt-2 max-w-4xl text-lg text-ink/90">
        The same people answered the same questions at Day 0 and again at Week 10. Each line runs
        from where the group started (○ hollow) to where it finished (● solid) on a 0–100 scale.
      </p>

      <div className="mt-6">
        {published ? (
          <>
            <ChangeChart metrics={metrics} nPairs={nPairs} />
            <LifeAnchorCards metrics={metrics} />
          </>
        ) : (
          <WithheldPanel headline="No measure publishes until 20 people finish both maps." nSoFar={nPairs} />
        )}
      </div>

      {/* Change Order 01, Phase 6 — Copy Block 2, verbatim, one line beneath
          section 02 (its other appearance is the footer). */}
      <p className="mt-6 max-w-4xl text-sm leading-relaxed text-muted">{BLOCK_2_RESULTS_DISCLOSURE}</p>
    </section>
  );
}
