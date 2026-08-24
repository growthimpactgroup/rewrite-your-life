import type { Metadata } from "next";
import { PREVIEW_PUBLISHED_AGGREGATES } from "@/lib/previewData";
import { getAnchors, getLatestAnchor } from "@/lib/anchors";
import PreviewBanner from "@/components/results/PreviewBanner";
import ResultsPageBody from "@/components/results/ResultsPageBody";

// Change Order 01, Phase 1 — the internal render target for
// /results?preview=published (see proxy.ts for the rewrite). Not linked
// from anywhere in the public build; always noindex regardless of launch
// state, since it never shows real data. Always dynamic (no revalidate
// export) — this route doesn't touch the database at all, so "dynamic"
// costs nothing here, unlike the real /results page.
export const metadata: Metadata = {
  title: "PREVIEW — Rewrite Your Life Measured Results",
  robots: { index: false, follow: false },
};

export default function PreviewResultsPublishedPage() {
  const aggregates = PREVIEW_PUBLISHED_AGGREGATES;
  const anchors = getAnchors();
  const latestAnchor = getLatestAnchor();

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-surface">
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
