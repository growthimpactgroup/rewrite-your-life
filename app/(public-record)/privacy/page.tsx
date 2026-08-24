import type { Metadata } from "next";
import { getPublicAggregates, isLaunched } from "@/lib/publicAggregates";
import { BLOCK_5_PRIVACY_NOTICE } from "@/lib/copyBlocks";

// Change Order 01, Phase 6 — built from Copy Block 5, verbatim (Operating
// Rule 4), split at its own natural sub-headers for readability only.
// Same noindex-until-launch gate as the rest of the public-record pages.
export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  const aggregates = await getPublicAggregates("ryl");
  return {
    title: "Privacy — Rewrite Your Life | Growth Impact Group",
    description: "What the Rewrite Your Life Public Outcome Record collects, why, who sees it, and how to request deletion.",
    robots: isLaunched(aggregates) ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-surface">
      <header className="border-b border-border px-6 py-10 sm:px-10 sm:py-14">
        <p className="font-mono text-xs font-medium tracking-widest text-muted uppercase">
          Growth Impact Group · Public Outcome Record
        </p>
        <h1 className="mt-3 text-4xl font-bold text-ink">Privacy</h1>
      </header>

      <div className="space-y-6 px-6 py-10 sm:px-10">
        {BLOCK_5_PRIVACY_NOTICE.map((paragraph, i) => (
          <p key={i} className="max-w-2xl text-lg leading-relaxed text-ink/90">
            {paragraph}
          </p>
        ))}
      </div>

      <footer className="px-6 py-10 font-mono text-xs text-muted sm:px-10">
        <a href="/results" className="text-primary underline">
          ← Back to the Public Outcome Record
        </a>
      </footer>
    </main>
  );
}
