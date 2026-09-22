import type { Metadata } from "next";
import { PREVIEW_PUBLISHED_AGGREGATES } from "@/lib/previewData";
import { getAnchors, getLatestAnchor } from "@/lib/anchors";
import PreviewBanner from "@/components/results/PreviewBanner";
import ResultsPageBody from "@/components/results/ResultsPageBody";

// Change Order 01, Phase 1 — the internal render target for
// /results?preview=published (see proxy.ts for the rewrite). Not linked
// from anywhere in the public build; always noindex regardless of launch
// state, since the aggregate numbers shown here are always fake. The
// anchors are the real ones, though (getAnchors() reads the real "proofs"
// Storage bucket) — always dynamic (no revalidate export) since this page
// was never eligible for static generation anyway.
export const metadata: Metadata = {
  title: "PREVIEW — Rewrite Your Life Measured Results",
  robots: { index: false, follow: false },
};

export default async function PreviewResultsPublishedPage() {
  const aggregates = PREVIEW_PUBLISHED_AGGREGATES;
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
