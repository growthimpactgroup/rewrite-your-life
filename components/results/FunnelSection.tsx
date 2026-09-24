import type { PublicAggregates } from "@/lib/publicAggregates";
import SectionHeading from "./SectionHeading";

export default function FunnelSection({ funnel }: { funnel: PublicAggregates["funnel"] }) {
  // null specifically means n_eligible is 0 (nobody's reached Week 10 yet,
  // so a percent-of-eligible would be a 0/0). Rather than stitch that null
  // into "— — of eligible" (two dashes), drop the rate clause entirely in
  // that case instead of showing a nonsensical rate.
  const completedLabel =
    funnel.completion_rate === null
      ? "Completed both"
      : `Completed both — ${funnel.completion_rate}% of eligible`;

  const stats = [
    { value: funnel.total_submissions.toString(), label: "Total submissions recorded" },
    { value: funnel.n_started.toString(), label: "Started — Day 0 baseline taken" },
    { value: funnel.n_in_progress.toString(), label: "Still inside the ten weeks" },
    { value: funnel.n_eligible.toString(), label: "Reached Week 10 — had the chance to finish" },
    { value: funnel.n_pairs.toString(), label: completedLabel },
  ];

  return (
    <section className="border-b border-border px-6 py-10 sm:px-10 sm:py-14">
      <SectionHeading eyebrow="01 · What the statistics are based on" title="What The Statistics Are Based On" />
      {/* 2026-08-28, Jeff/Frances review call — Item 7: a plain-language walk
          through how to read everything below, before any specific number
          shows up — how many people were surveyed, what actually happened
          to them, what statistics get generated from that, and what those
          statistics mean. */}
      <p className="mt-2 max-w-4xl text-lg leading-relaxed text-ink/90">
        Here&apos;s how to read everything on this page.{" "}
        <span className="font-bold text-ink">{funnel.total_submissions} people</span> have taken this
        survey. Some are still partway through their ten weeks; some finished; some stopped attending.
        Only the <span className="font-bold text-ink">{funnel.n_pairs}</span>{" "}
        people who finished all ten weeks and were measured twice — once at the start, once at the end — get counted in the
        statistics below. Those statistics are simply the group&apos;s own averages and how much they
        moved. They show what happened for people who finished this program — not a guarantee of what
        will happen for you.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="bg-card px-5 py-6">
            <div className="text-3xl font-bold text-ink sm:text-4xl">{s.value}</div>
            <div className="mt-1 font-mono text-sm text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      <p className="mt-6 max-w-4xl leading-relaxed text-ink/90">
        <span className="font-bold text-ink">One more thing worth knowing:</span>{" "}
        <span className="font-bold text-ink">{funnel.n_in_progress}</span>{" "}
        people are still inside their ten weeks and aren&apos;t counted for or against the completion rate above. People who stopped
        attending are counted in the total but can&apos;t be measured at Week 10. Finishers are
        self-selected — weigh the results accordingly.
      </p>
    </section>
  );
}
