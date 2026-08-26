import type { Metric } from "@/lib/publicAggregates";
import { formatPercentChange } from "./format";
import { DOMAIN_DESCRIPTIONS, interpretationFor } from "@/lib/domainDescriptions";

// Change Order 01, Phase 4 — replaces the thirteen-row table with one row
// per domain measure: a hollow marker at the Day 0 group average, a solid
// marker at Week 10, joined by a bar, on a shared 0-100% track so every row
// is visually comparable. Declines render in the same red on the same axis
// — never hidden, never a separate scale.
//
// 2026-08-26, at Frances's request: a first-time visitor had no way to
// know what "AI Orchestration Index" (or any domain) actually measures, or
// what a given result meant. Each row now carries a plain-language "what
// this measures" line and a result sentence in percentage-only phrasing
// ("35% to 82% — a 135% increase") plus a one-line takeaway — see
// lib/domainDescriptions.ts, grounded in that domain's actual two
// questions, not invented.

function DotRow({ metric }: { metric: Metric }) {
  const day0 = metric.day0_avg as number;
  const week10 = metric.week10_avg as number;
  const declined = week10 < day0;
  const left = Math.min(day0, week10);
  const width = Math.max(0, Math.abs(week10 - day0));
  const description = DOMAIN_DESCRIPTIONS[metric.key];
  const interpretation = interpretationFor(metric.key, metric.delta_pts as number);

  return (
    <div className="py-6">
      <h3 className="text-2xl font-bold text-ink">{metric.label}</h3>
      {description && <p className="mt-1 text-base text-muted">{description.what}</p>}

      <div className="relative mt-4 h-4 w-full">
        <div className="absolute top-1/2 right-0 left-0 h-px -translate-y-1/2 bg-border" />
        <div
          className={`absolute top-1/2 h-0.5 -translate-y-1/2 ${declined ? "bg-red-400" : "bg-accent/50"}`}
          style={{ left: `${left}%`, width: `${width}%` }}
        />
        <span
          className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-card ${declined ? "border-red-500" : "border-accent"}`}
          style={{ left: `${day0}%` }}
        />
        <span
          className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ${declined ? "bg-red-500" : "bg-accent"}`}
          style={{ left: `${week10}%` }}
        />
      </div>
      {/* 2026-08-26, at Frances's request: labels directly on the line so
          it reads immediately as a 0-100% progress/scale line, not just a
          decorative bar — rather than relying on the reader to find the
          footer note lower down. */}
      <div className="mt-1 mb-4 flex justify-between font-mono text-xs text-muted">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>

      <p className={`text-lg font-bold ${declined ? "text-red-600" : "text-emerald-700"}`}>
        {formatPercentChange(day0, week10, metric.delta_pct)}
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
    <div className="flex items-center justify-between py-4">
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
    <div className="rounded-lg border border-border bg-card px-5 py-6 sm:px-8">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border pb-4 font-mono text-base">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full border-2 border-accent bg-card" />
          <span className="font-semibold text-ink">Day 0 — where the group started</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-accent" />
          <span className="font-semibold text-ink">Week 10 — where the group finished</span>
        </span>
        <span className="text-muted">{nPairs} people, measured twice · sorted by gain</span>
      </div>
      <div className="divide-y divide-border">
        {rows.map((m) =>
          m.day0_avg === null || m.week10_avg === null ? (
            <RowWithheld key={m.key} metric={m} />
          ) : (
            <DotRow key={m.key} metric={m} />
          ),
        )}
      </div>
      <p className="mt-4 border-t border-border pt-4 font-mono text-sm text-muted">
        Scale: 0–100% of the maximum score. Group averages of the same {nPairs} people at both points.
        Declines, when they occur, render in red on this same axis.
      </p>
    </div>
  );
}
