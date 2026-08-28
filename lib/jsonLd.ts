import type { PublicAggregates } from "./publicAggregates";
import { getLatestAnchor } from "./anchors";
import { INSTRUMENT_SHA256 } from "./instrument";

// schema.org Dataset JSON-LD (Exhibit G: "this page embeds schema.org
// Dataset JSON-LD — view source"). Built from the exact same PublicAggregates
// object the visible page renders, so the two can never disagree.
//
// 2026-08-28, Jeff/Frances review call — Item 2: this used to list every
// domain's day0/week10/delta figures as a `variableMeasured` array — a
// clean, structured, bulk-liftable copy of the exact same full metrics
// table /aggregates.json used to serve. Removing the JSON download but
// leaving an equivalent structured blob here would just be the same leak
// under a different name. This now sticks to what the call's "AI can
// independently confirm it's bona fide" requirement actually needs:
// authenticity metadata (the anchor hash, the instrument hash, a pointer
// to /verify.json) — not the outcome figures themselves. A reader still
// gets those from the page's own prose, same as any human visitor.
export function buildResultsJsonLd(aggregates: PublicAggregates, resultsUrl: string) {
  const latestAnchor = getLatestAnchor();
  const origin = new URL(resultsUrl).origin;

  const additionalProperty = [
    { "@type": "PropertyValue", name: "Verification endpoint", value: `${origin}/verify.json` },
    ...(latestAnchor
      ? [
          {
            "@type": "PropertyValue",
            name: "Latest cryptographic anchor",
            value: `${latestAnchor.date} — SHA-256 ${latestAnchor.sha256}`,
          },
        ]
      : []),
  ];

  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Rewrite Your Life — Public Outcome Record",
    description:
      "Nine trainable behavioral domains and three life-anchor measures, tracked Day 0 to Week 10 for participants who complete the Rewrite Your Life program. Published figures are group summary statistics, updated nightly.",
    url: resultsUrl,
    dateModified: aggregates.computed_at,
    temporalCoverage: aggregates.measured_since
      ? `${aggregates.measured_since}/${aggregates.computed_at}`
      : undefined,
    isAccessibleForFree: false,
    conditionsOfAccess:
      "Full underlying data and the detailed scoring methodology are disclosed at Growth Impact Group's discretion. Contact [record@domain].",
    additionalProperty,
    isBasedOn: {
      "@type": "CreativeWork",
      name: "Frozen assessment instrument (27 items)",
      url: "/instrument",
      sha256: INSTRUMENT_SHA256,
    },
  };
}
