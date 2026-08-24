import { formatDate, formatDateTime } from "./format";
import type { Anchor } from "@/lib/anchors";

export default function Header({
  measuredSince,
  computedAt,
  latestAnchor,
}: {
  measuredSince: string | null;
  computedAt: string;
  latestAnchor: Anchor | null;
}) {
  return (
    <header className="border-b border-border px-6 py-10 sm:px-10 sm:py-14">
      <p className="font-mono text-xs font-medium tracking-widest text-muted uppercase">
        Growth Impact Group · Public Outcome Record
      </p>
      <h1 className="mt-3 text-4xl font-bold text-ink sm:text-5xl">
        Rewrite Your Life
        <br />
        Measured Results
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/90">
        Every participant answers the same 27 questions at Day 0 and again at Week 10. The
        questions never change. This page shows what moved — including the people who
        didn&apos;t improve — and gives you everything you need to check the record yourself.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-5 font-mono text-sm">
        <span className="inline-flex items-center gap-2 font-semibold text-emerald-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-600" />
          </span>
          Updates automatically
        </span>
        <span className="text-muted">
          Measured since <span className="font-semibold text-ink">{measuredSince ? formatDate(measuredSince) : "—"}</span>
        </span>
        <span className="text-muted">
          Last refresh <span className="font-semibold text-ink">{formatDateTime(computedAt)}</span>
        </span>
        <span className="text-muted">
          Last blockchain anchor{" "}
          <span className="font-semibold text-ink">
            {latestAnchor ? formatDate(latestAnchor.date) : "not yet anchored"}
          </span>
        </span>
      </div>
    </header>
  );
}
