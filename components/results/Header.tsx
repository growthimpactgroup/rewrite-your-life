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

      <div className="mt-8 border-t border-border pt-6 font-mono">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3.5 w-3.5 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-600" />
          </span>
          <span className="text-xl font-bold text-emerald-700 sm:text-2xl">Updates automatically</span>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="rounded-xl border border-border bg-card px-5 py-4 sm:flex-1">
            <div className="text-sm font-bold text-muted">Measured since</div>
            <div className="mt-1 text-lg font-bold text-ink">{measuredSince ? formatDate(measuredSince) : "—"}</div>
          </div>
          <div className="rounded-xl border border-border bg-card px-5 py-4 sm:flex-1">
            <div className="text-sm font-bold text-muted">Last refresh</div>
            <div className="mt-1 text-lg font-bold text-ink">{formatDateTime(computedAt)}</div>
          </div>
          <div className="rounded-xl border border-border bg-card px-5 py-4 sm:flex-1">
            <div className="text-sm font-bold text-muted">Last blockchain anchor</div>
            <div className="mt-1 text-lg font-bold text-ink">
              {latestAnchor ? formatDate(latestAnchor.date) : "not yet anchored"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
