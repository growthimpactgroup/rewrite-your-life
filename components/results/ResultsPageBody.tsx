import type { PublicAggregates } from "@/lib/publicAggregates";
import type { Anchor } from "@/lib/anchors";
import { buildResultsJsonLd } from "@/lib/jsonLd";
import Header from "./Header";
import HeadlineBand from "./HeadlineBand";
import FunnelSection from "./FunnelSection";
import MatchedPairsTable from "./MatchedPairsTable";
import DistributionRibbon from "./DistributionRibbon";
import LimitationsSection from "./LimitationsSection";
import VerifySection from "./VerifySection";
import AIAgentsBlock from "./AIAgentsBlock";
import ResultsFooter from "./ResultsFooter";

const SITE_URL = "https://rewrite-your-life.vercel.app";

// Shared between the real /results page (real data, static, zero DB queries
// per load) and the seeded preview route (fake data, always dynamic) — one
// rendering path so the two can never visually drift apart. See
// app/(public-record)/results/page.tsx and app/_preview/results-published
// for how each one calls this.
export default function ResultsPageBody({
  aggregates,
  anchors,
  latestAnchor,
  includeJsonLd,
}: {
  aggregates: PublicAggregates;
  anchors: Anchor[];
  latestAnchor: Anchor | null;
  /** JSON-LD claims to describe the real dataset — never emit it against
   * seeded preview data. */
  includeJsonLd: boolean;
}) {
  const jsonLd = includeJsonLd ? buildResultsJsonLd(aggregates, `${SITE_URL}/results`) : null;

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <Header
        measuredSince={aggregates.measured_since}
        computedAt={aggregates.computed_at}
        latestAnchor={latestAnchor}
      />
      <HeadlineBand aggregates={aggregates} latestAnchor={latestAnchor} />
      <FunnelSection funnel={aggregates.funnel} />
      <MatchedPairsTable metrics={aggregates.metrics} />
      <DistributionRibbon distribution={aggregates.distribution} nPairs={aggregates.funnel.n_pairs} />
      <LimitationsSection nExcludedStraightline={aggregates.hygiene.n_excluded_straightline} />
      <VerifySection anchors={anchors} />
      <AIAgentsBlock />
      <ResultsFooter />
    </>
  );
}
