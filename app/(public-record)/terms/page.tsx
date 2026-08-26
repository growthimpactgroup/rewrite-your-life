import type { Metadata } from "next";
import { getPublicAggregates, isLaunched } from "@/lib/publicAggregates";
import { BLOCK_6_SIXTH_LIMITATION } from "@/lib/copyBlocks";

// Change Order 01, Phase 6 — DO: "informational purposes, no warranty, no
// reliance, GIG owns the instrument and the dataset." Also carries Copy
// Block 6 verbatim (Operating Rule 4) — see lib/copyBlocks.ts's comment
// for why it lands here rather than the limitations list.
export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  const aggregates = await getPublicAggregates("ryl");
  return {
    title: "Terms of Use — Rewrite Your Life | Growth Impact Group",
    description: "Terms of use for the Rewrite Your Life Public Outcome Record.",
    robots: isLaunched(aggregates) ? { index: true, follow: true } : { index: false, follow: false },
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border px-6 py-8 sm:px-10">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      <div className="mt-3 max-w-4xl space-y-3 leading-relaxed text-ink/90">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-surface">
      <header className="border-b border-border px-6 py-10 sm:px-10 sm:py-14">
        <p className="font-mono text-xs font-medium tracking-widest text-muted uppercase">
          Growth Impact Group · Public Outcome Record
        </p>
        <h1 className="mt-3 text-4xl font-bold text-ink">Terms of Use</h1>
      </header>

      <Section title="Informational purposes">
        <p>
          This page and the data behind it are published for informational purposes — a public record
          of program outcomes. Nothing on this page or reachable from it is an offer, solicitation, or
          part of any contract.
        </p>
      </Section>

      <Section title="No warranty">
        <p>
          This page and its data are provided as-is, without warranty of any kind, express or implied,
          including as to accuracy, completeness, or fitness for a particular purpose.
        </p>
      </Section>

      <Section title="No reliance">
        <p>
          Nothing on this page should be relied on as a prediction, guarantee, or professional
          recommendation. See the results disclosure and limitations sections of the results page for
          what these figures are and are not.
        </p>
      </Section>

      <Section title="Ownership">
        <p>
          Growth Impact Group, LLC owns the assessment instrument and the underlying dataset. No part
          of the instrument or dataset may be reproduced or redistributed without permission.
        </p>
      </Section>

      <Section title="Medical disclaimer">
        <p>{BLOCK_6_SIXTH_LIMITATION}</p>
      </Section>

      <footer className="px-6 py-10 font-mono text-xs text-muted sm:px-10">
        <a href="/results" className="text-primary underline">
          ← Back to the Public Outcome Record
        </a>
      </footer>
    </main>
  );
}
