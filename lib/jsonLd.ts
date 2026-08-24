import type { PublicAggregates } from "./publicAggregates";
import { getLatestAnchor } from "./anchors";
import { INSTRUMENT_SHA256 } from "./instrument";

// schema.org Dataset JSON-LD (Exhibit G: "this page embeds schema.org
// Dataset JSON-LD — view source"). Built from the exact same PublicAggregates
// object the visible page renders, so the two can never disagree.
export function buildResultsJsonLd(aggregates: PublicAggregates, resultsUrl: string) {
  const latestAnchor = getLatestAnchor();

  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Rewrite Your Life — Public Outcome Record",
    description:
      "Aggregate Day 0 to Week 10 outcome data for the Rewrite Your Life program, updated nightly from raw participant submissions.",
    url: resultsUrl,
    dateModified: aggregates.computed_at,
    temporalCoverage: aggregates.measured_since
      ? `${aggregates.measured_since}/${aggregates.computed_at}`
      : undefined,
    distribution: [
      { "@type": "DataDownload", encodingFormat: "application/json", contentUrl: "/aggregates.json" },
      { "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: "/aggregates.csv" },
    ],
    variableMeasured: aggregates.metrics.map((m) => ({
      "@type": "PropertyValue",
      name: m.label,
      value: m.published ? m.week10_avg : null,
      description: m.published
        ? `Day 0: ${m.day0_avg}, Week 10: ${m.week10_avg}, change: ${m.delta_pts} pts (${m.delta_pct}%), n=${m.n}`
        : `Collecting — publishes at 20 matched pairs (currently n=${m.n})`,
    })),
    ...(latestAnchor
      ? {
          additionalProperty: {
            "@type": "PropertyValue",
            name: "Latest cryptographic anchor",
            value: `${latestAnchor.date} — SHA-256 ${latestAnchor.sha256}`,
          },
        }
      : {}),
    isBasedOn: {
      "@type": "CreativeWork",
      name: "Frozen assessment instrument (27 items)",
      url: "/instrument",
      sha256: INSTRUMENT_SHA256,
    },
  };
}
