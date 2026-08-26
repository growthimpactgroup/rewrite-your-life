import type { Metadata } from "next";
import { getAnchors } from "@/lib/anchors";
import { formatDate } from "@/components/results/format";
import { getPublicAggregates, isLaunched } from "@/lib/publicAggregates";

export const revalidate = false;

// Same noindex-until-launch gate as /results — see that page's comment.
export async function generateMetadata(): Promise<Metadata> {
  const aggregates = await getPublicAggregates("ryl");
  return {
    title: "Proofs — Rewrite Your Life | Growth Impact Group",
    description: "Monthly cryptographic anchor proofs for the Rewrite Your Life Public Outcome Record.",
    robots: isLaunched(aggregates) ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default function ProofsPage() {
  const anchors = getAnchors();

  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-surface">
      <header className="border-b border-border px-6 py-10 sm:px-10 sm:py-14">
        <p className="font-mono text-xs font-medium tracking-widest text-muted uppercase">
          Growth Impact Group · Public Outcome Record
        </p>
        <h1 className="mt-3 text-4xl font-bold text-ink">Anchor Proofs</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink/90">
          Every monthly anchor, in full. Each one stamps a SHA-256 fingerprint of that month&apos;s
          raw dataset to the public OpenTimestamps calendars — independent of Growth Impact Group,
          and impossible to alter retroactively without the break being visible.
        </p>
      </header>

      <div className="px-6 py-10 sm:px-10">
        {anchors.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-5 py-6 text-sm text-muted">
            No anchors filed yet. The first monthly anchor will appear here as soon as it&apos;s
            filed.
          </div>
        ) : (
          <ul className="space-y-4">
            {anchors.map((a) => (
              <li key={a.date} className="rounded-lg border border-border bg-card p-5">
                <p className="font-mono text-xs font-bold tracking-widest text-ink uppercase">
                  Anchored {formatDate(a.date)} · {a.row_count} rows
                </p>
                <p className="mt-2 font-mono text-xs break-all text-muted">SHA-256 {a.sha256}</p>
                <a href={`/proofs/${a.file}`} className="mt-2 inline-block font-mono text-xs text-primary underline">
                  Download proof file (.ots)
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="px-6 py-10 font-mono text-xs text-muted sm:px-10">
        <a href="/results" className="text-primary underline">
          ← Back to the Public Outcome Record
        </a>
      </footer>
    </main>
  );
}
