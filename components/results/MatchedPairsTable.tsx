import type { Metric } from "@/lib/publicAggregates";
import DeltaBar from "./DeltaBar";
import { formatDelta, formatPercent, formatAnchorValue } from "./format";
import { PUBLISH_THRESHOLD } from "@/lib/publishThreshold";

function CollectingRow({ metric, italic }: { metric: Metric; italic: boolean }) {
  return (
    <tr className="border-b border-border last:border-0">
      <td className={`py-4 pr-4 text-ink ${italic ? "italic" : ""}`}>{metric.label}</td>
      <td colSpan={3} className="py-4 pr-4 text-sm text-muted">
        Collecting — publishes at {PUBLISH_THRESHOLD} matched pairs
      </td>
      <td className="py-4 text-right font-mono text-sm text-muted">{metric.n}</td>
    </tr>
  );
}

function DomainRow({ metric, maxAbsDeltaPts }: { metric: Metric; maxAbsDeltaPts: number }) {
  if (!metric.published || metric.day0_avg === null || metric.week10_avg === null) {
    return <CollectingRow metric={metric} italic={false} />;
  }
  const isDecline = (metric.delta_pts ?? 0) < 0;

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-4 pr-4 text-ink">{metric.label}</td>
      <td className="py-4 pr-4 text-right font-mono text-sm text-ink">{formatPercent(metric.day0_avg)}</td>
      <td className="py-4 pr-4 text-right font-mono text-sm text-ink">{formatPercent(metric.week10_avg)}</td>
      <td className="py-4 pr-4">
        <div className="flex items-center gap-3">
          <DeltaBar deltaPts={metric.delta_pts ?? 0} maxAbsDeltaPts={maxAbsDeltaPts} />
          <span
            className={`whitespace-nowrap font-mono text-sm font-semibold ${isDecline ? "text-red-700" : "text-emerald-700"}`}
          >
            {formatDelta(metric.delta_pts ?? 0, metric.delta_pct)}
          </span>
        </div>
      </td>
      <td className="py-4 text-right font-mono text-sm text-muted">{metric.n}</td>
    </tr>
  );
}

function AnchorRow({ metric }: { metric: Metric }) {
  if (!metric.published || metric.day0_avg === null || metric.week10_avg === null) {
    return <CollectingRow metric={metric} italic />;
  }
  const isDecline = (metric.delta_pts ?? 0) < 0;

  return (
    <tr className="border-b border-border italic last:border-0">
      <td className="py-4 pr-4 text-ink">{metric.label}</td>
      <td className="py-4 pr-4 text-right font-mono text-sm text-ink">{formatAnchorValue(metric.day0_avg)}</td>
      <td className="py-4 pr-4 text-right font-mono text-sm text-ink">{formatAnchorValue(metric.week10_avg)}</td>
      <td className="py-4 pr-4" />
      <td colSpan={1} className="py-4 text-right">
        <span className={`font-mono text-sm font-semibold ${isDecline ? "text-red-700" : "text-emerald-700"}`}>
          {formatDelta(metric.delta_pts ?? 0, metric.delta_pct, "")}
        </span>
      </td>
    </tr>
  );
}

export default function MatchedPairsTable({ metrics }: { metrics: Metric[] }) {
  const domains = metrics.filter((m) => m.type === "domain");
  const anchors = metrics.filter((m) => m.type === "anchor");

  const maxAbsDeltaPts = Math.max(
    1,
    ...domains.filter((m) => m.published && m.delta_pts !== null).map((m) => Math.abs(m.delta_pts as number)),
  );

  return (
    <section className="border-b border-border px-6 py-10 sm:px-10 sm:py-14">
      <p className="font-mono text-xs font-semibold tracking-widest text-muted uppercase">
        02 · Day 0 → Week 10 · matched pairs only
      </p>
      <p className="mt-2 max-w-2xl text-lg text-ink/90">
        Same person, same questions, ten weeks apart. Scores are the group average, shown as a
        percentage of the maximum.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-left">
          <thead>
            <tr className="border-b-2 border-ink font-mono text-xs tracking-widest text-muted uppercase">
              <th className="pb-3 pr-4 font-semibold">What was measured</th>
              <th className="pb-3 pr-4 text-right font-semibold">Day 0</th>
              <th className="pb-3 pr-4 text-right font-semibold">Week 10</th>
              <th className="pb-3 pr-4 font-semibold">Change</th>
              <th className="pb-3 text-right font-semibold">N</th>
            </tr>
          </thead>
          <tbody>
            {domains.map((m) => (
              <DomainRow key={m.key} metric={m} maxAbsDeltaPts={maxAbsDeltaPts} />
            ))}
            {anchors.map((m) => (
              <AnchorRow key={m.key} metric={m} />
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-5 font-mono text-xs text-muted">
        Metrics with fewer than {PUBLISH_THRESHOLD} matched pairs are withheld until they reach the
        threshold — small groups can identify individuals.
      </p>
    </section>
  );
}
