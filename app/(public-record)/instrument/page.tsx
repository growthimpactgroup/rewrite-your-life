import type { Metadata } from "next";
import { FROZEN_QUESTIONS, INSTRUMENT_SHA256 } from "@/lib/instrument";
import { getPublicAggregates, isLaunched } from "@/lib/publicAggregates";

export const revalidate = false;

// Same noindex-until-launch gate as /results — see that page's comment.
export async function generateMetadata(): Promise<Metadata> {
  const aggregates = await getPublicAggregates("ryl");
  return {
    title: "The Instrument — Rewrite Your Life | Growth Impact Group",
    description: "All 27 frozen questions behind the Rewrite Your Life Public Outcome Record, byte-identical to what participants answer.",
    robots: isLaunched(aggregates) ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default function InstrumentPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-surface">
      <header className="border-b border-border px-6 py-10 sm:px-10 sm:py-14">
        <p className="font-mono text-xs font-medium tracking-widest text-muted uppercase">
          Public Outcome Record
        </p>
        <h1 className="mt-3 text-4xl font-bold text-ink">The Frozen Instrument</h1>
        <p className="mt-5 max-w-4xl text-lg leading-relaxed text-ink/90">
          All 27 questions, exactly as every participant sees them, in fixed order. Locked since the
          first real submission — no word changes after that point. This copy is byte-identical to
          the production instrument.
        </p>
        <p className="mt-5 font-mono text-xs text-muted break-all">SHA-256 {INSTRUMENT_SHA256}</p>
      </header>

      <ol className="divide-y divide-border px-6 sm:px-10">
        {FROZEN_QUESTIONS.map((q) => (
          <li key={q.id} className="py-6">
            <p className="font-mono text-xs text-muted">Item {q.id}</p>
            <p className="mt-1 text-lg text-ink">{q.text}</p>
            {q.example && <p className="mt-1 text-sm text-muted italic">e.g. {q.example}</p>}
          </li>
        ))}
      </ol>

      <footer className="px-6 py-10 font-mono text-xs text-muted sm:px-10">
        <a href="/results" className="text-primary underline">
          ← Back to the Public Outcome Record
        </a>
      </footer>
    </main>
  );
}
