import type { Metadata } from "next";
import { getPublicAggregates, isLaunched } from "@/lib/publicAggregates";
import { getAnchors, getLatestAnchor } from "@/lib/anchors";
import SampleBanner from "@/components/results/SampleBanner";
import Header from "@/components/results/Header";
import ResultsFooter from "@/components/results/ResultsFooter";
import ResultsPageBody from "@/components/results/ResultsPageBody";

// Statically generated, revalidated on-demand by the nightly job
// (app/api/cron/nightly/route.ts calls revalidatePath('/results')) — zero
// database queries on page load once built, per Section 5. Deliberately
// does NOT read searchParams (that would force this whole route dynamic,
// reintroducing a per-request DB query for every real visitor) — preview
// mode lives on a separate internal route instead, reached via a proxy
// rewrite. See proxy.ts and app/_preview/results-published/page.tsx.
export const revalidate = false;

// Section 10: "do not publish until 20+ matched pairs exist; until then the
// page runs privately on an unlisted URL." A known-but-unlinked URL isn't
// actually unlisted to search engines, so this is noindex until a human
// sets record_starts_at (the same switch Section 9's launch date uses) —
// see lib/publicAggregates.ts's isLaunched().
export async function generateMetadata(): Promise<Metadata> {
  const aggregates = await getPublicAggregates("ryl");
  return {
    title: "Rewrite Your Life — Measured Results | Growth Impact Group",
    description:
      "The public outcome record for the Rewrite Your Life program: Day 0 to Week 10 results, including participants who didn't improve, with cryptographic proof of the underlying data.",
    robots: isLaunched(aggregates) ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function ResultsPage() {
  const aggregates = await getPublicAggregates("ryl");
  const anchors = await getAnchors();
  const latestAnchor = await getLatestAnchor();

  if (!aggregates) {
    return (
      <main className="mx-auto min-h-screen max-w-6xl bg-surface">
        <SampleBanner />
        <Header measuredSince={null} computedAt={new Date().toISOString()} latestAnchor={null} />
        <section className="px-6 py-10 sm:px-10">
          <p className="text-lg text-ink/90">
            The nightly build hasn&apos;t run yet, so there are no real figures to show. This page
            will populate itself automatically the first time it does.
          </p>
        </section>
        <ResultsFooter />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-surface">
      <ResultsPageBody aggregates={aggregates} anchors={anchors} latestAnchor={latestAnchor} includeJsonLd />
    </main>
  );
}
