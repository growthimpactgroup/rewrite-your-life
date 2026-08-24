import { getPublicAggregates, type Metric } from "@/lib/publicAggregates";

// Same cache/revalidate model as /aggregates.json — see that file's comment.
export const revalidate = false;

const HEADER = [
  "metric_key",
  "label",
  "type",
  "day0_avg",
  "week10_avg",
  "delta_pts",
  "delta_pct",
  "n",
  "published",
];

function csvField(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toRow(m: Metric): string {
  return [m.key, m.label, m.type, m.day0_avg, m.week10_avg, m.delta_pts, m.delta_pct, m.n, m.published]
    .map(csvField)
    .join(",");
}

export async function GET() {
  let aggregates;
  try {
    aggregates = await getPublicAggregates("ryl");
  } catch (err) {
    console.error("aggregates.csv route error", err);
    return new Response("error,could not load aggregates\n", {
      status: 500,
      headers: { "Content-Type": "text/csv; charset=utf-8" },
    });
  }

  const rows = aggregates ? aggregates.metrics.map(toRow) : [];

  const csv = [HEADER.join(","), ...rows].join("\n") + "\n";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'inline; filename="ryl-aggregates.csv"',
    },
  });
}
