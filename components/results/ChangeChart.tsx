import type { Metric } from "@/lib/publicAggregates";
import { formatDomainChangeSentence } from "./format";
import { DOMAIN_DESCRIPTIONS, interpretationFor } from "@/lib/domainDescriptions";

// Change Order 01, Phase 4 — one row per domain measure, Day 0 vs. Week 10.
//
// 2026-08-26, at Frances's request: a first-time visitor had no way to
// know what "AI Orchestration Index" (or any domain) actually measures.
// Each row carries a plain-language "what this measures" line — see
// lib/domainDescriptions.ts, grounded in that domain's actual two
// questions, not invented.
//
// 2026-08-28, Jeff/Frances review call — Items 5 & 6: the small blue
// dot-and-line chart didn't read clearly to either reviewer, and with nine
// rows stacked in one divide-y list the whole section felt cramped. Each
// domain is now its own bordered card (visual separation), the Day 0 and
// Week 10 numbers are shown as two big square data blocks instead of a
// bar, and the result is spelled out as one plain sentence naming the
// domain ("People went from 35% to 82% in AI Orchestration — that's a
// 135% increase.") rather than left for the reader to infer from a chart.

function DotRow({ metric }: { metric: Metric }) {
  const day0 = metric.day0_avg as number;
  const week10 = metric.week10_avg as number;
  const declined = week10 < day0;
  const description = DOMAIN_DESCRIPTIONS[metric.key];
  const interpretation = interpretationFor(metric.key, metric.delta_pts as number);

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <h3 className="text-2xl font-bold text-ink">{metric.label}</h3>
      {description && <p className="mt-1 text-base text-muted">{description.what}</p>}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-surface px-5 py-4">
          <div className="font-mono text-xs font-semibold tracking-widest text-muted uppercase">Day 0</div>
          <div className="mt-1 text-4xl font-bold text-ink">{day0}%</div>
        </div>
        <div className="rounded-lg border border-border bg-surface px-5 py-4">
          <div className="font-mono text-xs font-semibold tracking-widest text-muted uppercase">Week 10</div>
          <div className={`mt-1 text-4xl font-bold ${declined ? "text-red-600" : "text-accent"}`}>{week10}%</div>
        </div>
      </div>

      <p className={`mt-4 text-lg font-bold ${declined ? "text-red-600" : "text-emerald-800"}`}>
        {formatDomainChangeSentence(metric.label, day0, week10, metric.delta_pct)}
      </p>
      {interpretation && <p className="mt-1 text-base text-ink/80">{interpretation}</p>}
    </div>
  );
}

// BLOCKED IF a published measure lacks a Day 0 or Week 10 average — render
// that row individually withheld rather than silently drop it. Shouldn't
// happen (getPublicAggregates scrubs day0_avg/week10_avg to null only when
// !published), but the row-level fallback is the gate's own requirement.
function RowWithheld({ metric }: { metric: Metric }) {
  console.error(
    `BLOCKED: ${metric.label} lacks a Day 0 or Week 10 average — rendered withheld, not dropped.`,
  );
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card p-6">
      <div className="font-semibold text-ink">{metric.label}</div>
      <div className="font-mono text-sm text-muted">Withheld — average unavailable</div>
    </div>
  );
}

export default function ChangeChart({ metrics, nPairs }: { metrics: Metric[]; nPairs: number }) {
  const rows = metrics
    .filter((m) => m.type === "domain" && m.published)
    .sort((a, b) => (b.delta_pts ?? -Infinity) - (a.delta_pts ?? -Infinity));

  return (
    <div>
      <p className="font-mono text-base text-muted">
        <span className="font-semibold text-ink">{nPairs} people</span>, measured at Day 0 and again at Week
        10 · sorted by biggest gain first
      </p>
      <div className="mt-4 space-y-4">
        {rows.map((m) =>
          m.day0_avg === null || m.week10_avg === null ? (
            <RowWithheld key={m.key} metric={m} />
          ) : (
            <DotRow key={m.key} metric={m} />
          ),
        )}
      </div>
      <p className="mt-6 font-mono text-sm text-muted">
        Every number above is a percentage of the maximum possible score (0–100%), and is the group
        average of the same {nPairs} people at both points. Declines, when they occur, are shown in red.
      </p>
    </div>
  );
}
