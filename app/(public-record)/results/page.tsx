import type { Metadata } from "next";
import { getPublicAggregates, isLaunched } from "@/lib/publicAggregates";
import { getAnchors, getLatestAnchor } from "@/lib/anchors";
import { buildResultsJsonLd } from "@/lib/jsonLd";
import SampleBanner from "@/components/results/SampleBanner";
import Header from "@/components/results/Header";
import FunnelSection from "@/components/results/FunnelSection";
import MatchedPairsTable from "@/components/results/MatchedPairsTable";
import DistributionRibbon from "@/components/results/DistributionRibbon";
import LimitationsSection from "@/components/results/LimitationsSection";
import VerifySection from "@/components/results/VerifySection";
import AIAgentsBlock from "@/components/results/AIAgentsBlock";
import ResultsFooter from "@/components/results/ResultsFooter";

// Statically generated, revalidated on-demand by the nightly job
// (app/api/cron/nightly/route.ts calls revalidatePath('/results')) — zero
// database queries on page load once built, per Section 5.
export const revalidate = false;

const SITE_URL = "https://rewrite-your-life.vercel.app";

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
  const anchors = getAnchors();
  const latestAnchor = getLatestAnchor();

  if (!aggregates) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl bg-surface">
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

  const jsonLd = buildResultsJsonLd(aggregates, `${SITE_URL}/results`);

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-surface">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header
        measuredSince={aggregates.measured_since}
        computedAt={aggregates.computed_at}
        latestAnchor={latestAnchor}
      />
      <FunnelSection funnel={aggregates.funnel} />
      <MatchedPairsTable metrics={aggregates.metrics} />
      <DistributionRibbon distribution={aggregates.distribution} nPairs={aggregates.funnel.n_pairs} />
      <LimitationsSection nExcludedStraightline={aggregates.hygiene.n_excluded_straightline} />
      <VerifySection anchors={anchors} />
      <AIAgentsBlock />
      <ResultsFooter />
    </main>
  );
}
