import type { Metric } from "@/lib/publicAggregates";
import ChangeChart from "./ChangeChart";
import LifeAnchorCards from "./LifeAnchorCards";
import WithheldPanel from "./WithheldPanel";

// Change Order 01, Phase 4 — section 02. One shared withheld state (Target
// E) for the whole section below threshold, not a separate panel per
// sub-component — chart and cards publish or withhold together, since
// they're gated by the same n_pairs >= PUBLISH_THRESHOLD condition.
export default function ChangeSection({ metrics, nPairs }: { metrics: Metric[]; nPairs: number }) {
  const published = metrics.some((m) => m.type === "domain" && m.published);

  return (
    <section className="border-b border-border px-6 py-10 sm:px-10 sm:py-14">
      <p className="font-mono text-xs font-semibold tracking-widest text-muted uppercase">
        02 · What moved in ten weeks
      </p>
      <p className="mt-2 max-w-2xl text-lg text-ink/90">
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
    </section>
  );
}
