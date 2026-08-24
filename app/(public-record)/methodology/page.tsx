import type { Metadata } from "next";
import { getPublicAggregates, isLaunched } from "@/lib/publicAggregates";
import { PUBLISH_THRESHOLD } from "@/lib/publishThreshold";

// Change Order 01, Phase 5 — where the statistics vocabulary that used to
// live on the results page itself now lives. Same noindex-until-launch
// gate as /results and /instrument.
export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  const aggregates = await getPublicAggregates("ryl");
  return {
    title: "Methodology — Rewrite Your Life | Growth Impact Group",
    description:
      "How the Rewrite Your Life Public Outcome Record is computed: who counts as eligible, how matched pairs are formed, and what the privacy threshold protects.",
    robots: isLaunched(aggregates) ? { index: true, follow: true } : { index: false, follow: false },
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border px-6 py-10 sm:px-10">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      <div className="mt-3 max-w-2xl space-y-3 leading-relaxed text-ink/90">{children}</div>
    </section>
  );
}

export default function MethodologyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-surface">
      <header className="border-b border-border px-6 py-10 sm:px-10 sm:py-14">
        <p className="font-mono text-xs font-medium tracking-widest text-muted uppercase">
          Growth Impact Group · Public Outcome Record
        </p>
        <h1 className="mt-3 text-4xl font-bold text-ink">Methodology</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/90">
          The statistics vocabulary behind the results page, written out in full so the main page can
          stay in plain language. Every definition here is the exact rule the nightly build runs — not
          a simplification of it.
        </p>
      </header>

      <Section title="A matched pair">
        <p>
          A matched pair is one person&apos;s Day 0 submission and Week 10 submission, joined by the
          email address used to identify them. Only complete pairs are used to compute the Day 0 →
          Week 10 change figures — a person who submitted only Day 0 contributes to the funnel above
          but not to any change measure.
        </p>
      </Section>

      <Section title="Eligible vs. in progress">
        <p>
          A person is <em>eligible</em> once their Day 0 submission is ten or more weeks old — they&apos;ve
          had the full window to also submit Week 10, whether or not they did. A person is{" "}
          <em>in progress</em> if they have a Day 0 submission but ten weeks hasn&apos;t elapsed yet.
          Every person with a Day 0 baseline is exactly one or the other.
        </p>
        <p>
          The completion rate shown on the results page divides finished pairs by the eligible count —
          never by everyone who ever started. Counting people who haven&apos;t had the chance to finish
          yet as if they&apos;d failed to would measure the calendar, not the program.
        </p>
      </Section>

      <Section title="Domain scores">
        <p>
          Each of the nine behavioral domains is scored from its two questions per submission, as a
          percentage of the maximum possible score (0–100%). A domain&apos;s Day 0 or Week 10 average
          on the results page is the group mean of that percentage across everyone in a matched pair,
          at that time point.
        </p>
      </Section>

      <Section title="The privacy threshold">
        <p>
          No measure — no domain score, no life-anchor value, no distribution, no per-person dot —
          publishes anywhere (page, downloadable data, or structured data) until {PUBLISH_THRESHOLD}{" "}
          matched pairs exist. Below that, a group average is small enough that it could expose an
          individual&apos;s own answers. Every measure is still computed and stored nightly regardless
          — it simply isn&apos;t shown until the threshold is met, and nothing about which measures
          happen to cross first is selected or filtered.
        </p>
      </Section>

      <Section title="Improved, about the same, declined">
        <p>
          For each finished pair, we take that person&apos;s own average change across the nine domain
          scores, Week 10 minus Day 0, in points. A person is counted as improved at +5 points or more,
          declined at −5 points or more, and about the same in between. The dot plot on the results page
          shows one dot per person at their own value — never an average that could hide who moved which
          way.
        </p>
      </Section>

      <Section title="The life-anchor questions">
        <p>
          Two of the three life-anchor questions (life satisfaction, confidence in the next 12 months)
          are answered on a 0–10 scale and shown in that same unit. The mornings question is answered on
          the same 0–10 scale, for consistency with every other question in the instrument, but the
          question itself defines a proportional mapping onto real mornings out of 14 (a response of 10
          means 14 of the last 14 mornings) — the results page converts to that everyday unit for
          display. The relative percent change is unaffected by this conversion.
        </p>
      </Section>

      <Section title="Straight-line exclusion">
        <p>
          A submission where someone gave the same answer across ten or more consecutive items,
          including at least one reverse-worded item, is excluded from every aggregate figure on this
          site. The raw submission itself is never altered or deleted — it stays in the permanent
          record, just outside the group calculations.
        </p>
      </Section>

      <Section title="What is never published">
        <p>
          Individual answers, ever. Email addresses exist solely to match a person&apos;s Day 0
          submission to their Week 10 submission and are never shown, exported, or used to contact
          anyone.
        </p>
      </Section>

      <footer className="px-6 py-10 font-mono text-xs text-muted sm:px-10">
        <a href="/results" className="text-primary underline">
          ← Back to the Public Outcome Record
        </a>
      </footer>
    </main>
  );
}
