import type { Metadata } from "next";
import { getPublicAggregates, isLaunched } from "@/lib/publicAggregates";

// Change Order 01, Phase 5 — where the statistics vocabulary that used to
// live on the results page itself now lives. Same noindex-until-launch
// gate as /results and /instrument.
//
// 2026-08-28, Jeff/Frances review call — Item 2: trimmed from a full
// computation spec (exact reverse-scoring formula, the numeric privacy
// threshold, the exact straight-line detection rule) down to a
// plain-language summary. Jeff's instruction was minimum information
// necessary — a reader should understand HOW figures are computed
// conceptually, not have the exact rules to reproduce or game them. The
// detailed spec still exists internally; it's available on request, same
// as the full dataset (see /results' verification section).
export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  const aggregates = await getPublicAggregates("ryl");
  return {
    title: "Methodology — Rewrite Your Life | Growth Impact Group",
    description:
      "A plain-language summary of how the Rewrite Your Life Public Outcome Record is computed: who counts as eligible, how matched pairs are formed, and how domain scores work.",
    robots: isLaunched(aggregates) ? { index: true, follow: true } : { index: false, follow: false },
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border px-6 py-10 sm:px-10">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      <div className="mt-3 max-w-4xl space-y-3 leading-relaxed text-ink/90">{children}</div>
    </section>
  );
}

export default function MethodologyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-surface">
      <header className="border-b border-border px-6 py-10 sm:px-10 sm:py-14">
        <p className="font-mono text-xs font-medium tracking-widest text-muted uppercase">
          Public Outcome Record
        </p>
        <h1 className="mt-3 text-4xl font-bold text-ink">Methodology</h1>
        <p className="mt-5 max-w-4xl text-lg leading-relaxed text-ink/90">
          A plain-language summary of the statistics vocabulary behind the results page — what a
          matched pair is, how domain scores work, what gets excluded. This is a summary, not the
          full computation spec; that level of detail is available on request.
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
          at that time point. A couple of items are worded in the opposite direction on purpose, and
          scored accordingly, so a higher raw answer always means more of the trait in the final
          percentage.
        </p>
      </Section>

      <Section title="Improved, about the same, declined">
        <p>
          For each finished pair, we take that person&apos;s own average change across the nine domain
          scores, Week 10 minus Day 0. A person is counted as improved, declined, or about the same
          based on the size of that change — see the distribution section of the results page for the
          exact breakdown. Every finisher is shown, not just an average that could hide who moved
          which way.
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

      <Section title="Low-effort answers">
        <p>
          A submission that shows a clear pattern of low-effort, same-answer clicking is excluded from
          every aggregate figure on this site. The raw submission itself is never altered or
          deleted — it stays in the permanent record, just outside the group calculations. The exact
          detection rule isn&apos;t published, so it can&apos;t be gamed.
        </p>
      </Section>

      <Section title="What is never published">
        <p>
          Individual answers, ever. Email addresses exist solely to match a person&apos;s Day 0
          submission to their Week 10 submission and are never shown, exported, or used to contact
          anyone.
        </p>
      </Section>

      <Section title="Full detail, on request">
        <p>
          This page covers the concepts, not the exact formulas, thresholds, and edge-case rules the
          nightly build runs — that level of detail, along with the underlying dataset itself, is
          available on request, at Growth Impact Group&apos;s discretion. Contact{" "}
          <span className="font-bold text-ink">[record@domain]</span>. For automated verification
          without contacting us, see{" "}
          <a href="/verify.json" className="text-primary underline">
            /verify.json
          </a>
          .
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
