import type { Metric } from "@/lib/publicAggregates";
import { QUESTIONS } from "@/lib/questions";
import { formatAnchorValue, formatAnchorChangeSentence } from "./format";

// Change Order 01, Phase 4 — three cards, one per life-anchor question, in
// everyday units rather than the 0-10 response scale. Two of the three
// anchors ARE their own natural unit (a 0-10 satisfaction/confidence
// rating reads fine as "out of 10"). The mornings question is different:
// it's answered on the same shared 0-10 dial as every other question for
// UI consistency, but the question text itself ("10 = 14 of 14") defines a
// proportional mapping onto real mornings out of 14 — the everyday unit a
// person actually feels. Scaling by 1.4 converts the dial reading into that
// unit; delta_pct is unaffected (a ratio is scale-invariant), so only
// day0/week10/delta_pts need the conversion, done once here at display time
// rather than duplicating it into the SQL aggregate.
const ANCHOR_META: Record<string, { questionId: number; unit: string; scale: number }> = {
  life_satisfaction: { questionId: 19, unit: "out of 10", scale: 1 },
  mornings_with_priority: { questionId: 20, unit: "out of 14", scale: 1.4 },
  confidence_next_12mo: { questionId: 21, unit: "out of 10", scale: 1 },
};

function AnchorCard({ metric }: { metric: Metric }) {
  const meta = ANCHOR_META[metric.key];
  const question = QUESTIONS.find((q) => q.id === meta.questionId);
  const day0 = (metric.day0_avg as number) * meta.scale;
  const week10 = (metric.week10_avg as number) * meta.scale;
  const declined = week10 < day0;

  return (
    <div className="rounded-lg border-t-4 border-accent bg-card px-6 py-6 sm:flex sm:items-center sm:justify-between sm:gap-8">
      <p className="max-w-xl text-lg leading-relaxed text-ink/90 italic">&ldquo;{question?.text}&rdquo;</p>
      <div className="mt-4 sm:mt-0 sm:shrink-0 sm:text-right">
        <p className="font-mono text-4xl font-bold text-ink">
          {formatAnchorValue(day0)}
          <span className="mx-1 text-muted">→</span>
          <span className={declined ? "text-red-800 dark:text-red-300" : "text-emerald-800 dark:text-emerald-300"}>
            {formatAnchorValue(week10)}
          </span>
        </p>
        {/* 2026-08-28, Jeff/Frances review call — Item 8: spell the change
            out in a full sentence, same pattern as the domain rows,
            instead of a compact "+4.2 (+114%)" badge. Later the same day:
            green/red for increase/decrease, tuned per theme — emerald-800/
            red-800 in light mode, emerald-300/red-300 (pastel) in dark
            mode, since the 800-weight colors don't hold up against the
            dark backgrounds — same pairing as ChangeChart.tsx and
            DotPlot.tsx. */}
        <p className={`mt-2 text-lg font-bold ${declined ? "text-red-800 dark:text-red-300" : "text-emerald-800 dark:text-emerald-300"}`}>
          {formatAnchorChangeSentence(metric.delta_pct)}
        </p>
        <p className="mt-1 font-mono text-sm text-muted">
          {meta.unit} · group average · N = {metric.n}
        </p>
      </div>
    </div>
  );
}

// 2026-08-26, at Frances's request: the three cards used to sit side by
// side in one row. Because each question wraps to a different number of
// lines, the big before/after numbers landed at different heights across
// the row — an awkward, unintentional-looking stagger. Stacked vertically
// instead (one full-width card per anchor) so there's no cross-card row
// to misalign in the first place; each card arranges its own question and
// numbers side by side internally to still use the available width.
export default function LifeAnchorCards({ metrics }: { metrics: Metric[] }) {
  const anchors = metrics.filter((m) => m.type === "anchor" && m.published && m.day0_avg !== null && m.week10_avg !== null);
  if (anchors.length === 0) return null;

  return (
    <div className="mt-4 space-y-4">
      {anchors.map((m) => (
        <AnchorCard key={m.key} metric={m} />
      ))}
    </div>
  );
}
