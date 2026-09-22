import type { Metadata } from "next";
import { PREVIEW_WITHHELD_AGGREGATES } from "@/lib/previewData";
import { getAnchors, getLatestAnchor } from "@/lib/anchors";
import PreviewBanner from "@/components/results/PreviewBanner";
import ResultsPageBody from "@/components/results/ResultsPageBody";

// Change Order 01, Phase 1 — the internal render target for
// /results?preview=withheld (see proxy.ts). Exercises the sub-threshold
// (19-pair) path against seeded data, per Phase 1's own GATE requirement
// that withholding be verified live, not just read from code. Same rules as
// the published preview: never linked, always noindex, never real data.
export const metadata: Metadata = {
  title: "PREVIEW — Rewrite Your Life Measured Results",
  robots: { index: false, follow: false },
};

export default async function PreviewResultsWithheldPage() {
  const aggregates = PREVIEW_WITHHELD_AGGREGATES;
  const anchors = await getAnchors();
  const latestAnchor = await getLatestAnchor();

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-surface">
      <PreviewBanner />
      <ResultsPageBody
        aggregates={aggregates}
        anchors={anchors}
        latestAnchor={latestAnchor}
        includeJsonLd={false}
      />
    </main>
  );
}
