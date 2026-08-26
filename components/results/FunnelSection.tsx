import type { PublicAggregates } from "@/lib/publicAggregates";
import SectionHeading from "./SectionHeading";

export default function FunnelSection({ funnel }: { funnel: PublicAggregates["funnel"] }) {
  const rateLabel = funnel.completion_rate === null ? "—" : `${funnel.completion_rate}%`;

  const stats = [
    { value: funnel.total_submissions.toString(), label: "Total submissions recorded" },
    { value: funnel.n_started.toString(), label: "Started — Day 0 baseline taken" },
    { value: funnel.n_in_progress.toString(), label: "Still inside the ten weeks" },
    { value: funnel.n_eligible.toString(), label: "Reached Week 10 — had the chance to finish" },
    { value: funnel.n_pairs.toString(), label: `Completed both — ${rateLabel} of eligible` },
  ];

  return (
    <section className="border-b border-border px-6 py-10 sm:px-10 sm:py-14">
      <SectionHeading eyebrow="01 · The whole funnel" title="The Whole Funnel" />
      <p className="mt-2 text-lg text-ink/90">Starting with the number most programs leave out.</p>

      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="bg-card px-5 py-6">
            <div className="text-3xl font-bold text-ink sm:text-4xl">{s.value}</div>
            <div className="mt-1 font-mono text-sm text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      <p className="mt-6 max-w-2xl leading-relaxed text-ink/90">
        <span className="font-bold text-ink">Read this before the numbers below.</span> The Day 0 →
        Week 10 comparison covers only the <span className="font-bold text-ink">{funnel.n_pairs}</span>{" "}
        people who finished all ten weeks and submitted both maps.{" "}
        <span className="font-bold text-ink">{funnel.n_in_progress}</span> people are still inside their
        ten weeks and are not counted for or against the completion rate. People who stopped attending are
        counted above but cannot be measured at Week 10. Finishers are self-selected — weigh the
        results accordingly.
      </p>
    </section>
  );
}
