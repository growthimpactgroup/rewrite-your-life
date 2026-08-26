import type { PublicAggregates, Metric } from "@/lib/publicAggregates";
import type { Anchor } from "@/lib/anchors";
import { PUBLISH_THRESHOLD } from "@/lib/publishThreshold";
import { formatDate, formatDelta } from "./format";

// Change Order 01, Phase 3 — the verdict, in one spoken-language sentence,
// before any scroll. Every value reads from aggregate data; nothing here is
// hardcoded copy. Selects its state the same way distribution does
// (n_pairs >= PUBLISH_THRESHOLD) because it's the same underlying gate —
// see distribution.published, computed once at the source.
//
// "Typical measure": the domain metric (percentage-scale, excludes the
// three raw-unit life-anchor metrics — those get their own cards in Phase
// 4) sitting at the lower-median position when sorted by delta_pts. A real
// metric's own (pts, pct) pair, not an average across two different metrics
// with unrelated baselines — that would produce a percent figure that
// doesn't actually belong to the points figure next to it.
function typicalDomainMetric(metrics: Metric[]): Metric | null {
  const domain = metrics.filter((m) => m.type === "domain" && m.published && m.delta_pts !== null);
  if (domain.length === 0) return null;
  const sorted = [...domain].sort((a, b) => (a.delta_pts as number) - (b.delta_pts as number));
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

export default function HeadlineBand({
  aggregates,
  latestAnchor,
}: {
  aggregates: PublicAggregates;
  latestAnchor: Anchor | null;
}) {
  const { funnel, distribution, metrics, measured_since } = aggregates;

  // GATE: "BLOCKED IF: decline percentage unavailable -> do not ship the
  // published state." Structurally this pair is always set together at the
  // source (getPublicAggregates), so this should never trip — but the
  // published headline must never render without it, so fail loud and fall
  // back to the withheld state rather than ship a verdict missing its worst
  // number.
  const canPublish = distribution.published && distribution.pct_declined !== null && distribution.n_declined !== null;
  if (distribution.published && !canPublish) {
    console.error("BLOCKED: cannot render headline without decline figure.");
  }

  if (canPublish) {
    const domainMetrics = metrics.filter((m) => m.type === "domain");
    const nRose = domainMetrics.filter((m) => m.delta_pts !== null && m.delta_pts > 0).length;
    const typical = typicalDomainMetric(metrics);
    const declineClause =
      distribution.n_declined === 0
        ? "No finisher declined — that number publishes here too, the day one does."
        : `${distribution.pct_declined}% declined — that number is on this page too.`;

    return (
      <section data-theme="dark" className="border-b border-border bg-surface px-6 py-12 sm:px-10 sm:py-16">
        <p className="text-4xl leading-tight font-bold text-ink sm:text-5xl">
          {distribution.pct_improved}% of finishers <span className="text-accent">improved</span>
        </p>
        {typical && (
          <p className="mt-5 max-w-4xl text-lg leading-relaxed text-ink/90">
            Across {funnel.n_pairs} people who completed all ten weeks, the typical measure moved{" "}
            <span className="font-bold text-ink">{formatDelta(typical.delta_pts as number, typical.delta_pct)}</span>,
            and {nRose} of {domainMetrics.length} measures rose. {declineClause}
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-5 font-mono text-base text-muted">
          <span>
            <span className="font-semibold text-ink">{funnel.n_pairs} people</span> measured twice, ten weeks apart
          </span>
          <span>Same 27 questions, frozen</span>
          <span>
            Fingerprinted to a public blockchain{" "}
            <span className="font-semibold text-ink">
              {latestAnchor ? formatDate(latestAnchor.date) : "not yet anchored"}
            </span>
          </span>
        </div>
      </section>
    );
  }

  return (
    <section data-theme="dark" className="border-b border-border bg-surface px-6 py-12 sm:px-10 sm:py-16">
      <p className="text-4xl leading-tight font-bold text-ink sm:text-5xl">
        {funnel.total_submissions} maps <span className="text-accent">on the record</span>
      </p>
      <p className="mt-5 max-w-4xl text-lg leading-relaxed text-ink/90">
        {measured_since ? `This record opened on ${formatDate(measured_since)} and grows` : "This record grows"} every
        night on its own. Results publish when {PUBLISH_THRESHOLD} people have completed both the Day 0 and the Week
        10 assessment — not before.
      </p>
      <div className="mt-6 max-w-3xl rounded-lg border border-border bg-card px-6 py-5">
        <p className="font-mono text-sm font-semibold tracking-widest text-accent uppercase">
          Why nothing is published yet
        </p>
        <p className="mt-2 leading-relaxed text-ink/90">
          {funnel.n_pairs} of {PUBLISH_THRESHOLD} people measured twice, ten weeks apart, so far. Below
          that threshold a group is small enough
          that published averages could identify an individual, so every measure is withheld. Nothing is being
          selected, filtered, or waited on — the numbers appear the night the {PUBLISH_THRESHOLD}th pair lands,
          whatever they say.
        </p>
      </div>
    </section>
  );
}
