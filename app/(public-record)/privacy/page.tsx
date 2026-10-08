import type { Metadata } from "next";
import { getPublicAggregates, isLaunched } from "@/lib/publicAggregates";

// Privacy update, 2026-10-08 — the short version supplied with the privacy
// brief, with the one addition below: people who started before the private
// code existed were matched by email, and that has to be said plainly.
// Same noindex-until-launch gate as the rest of the public-record pages.
export const revalidate = false;

export async function generateMetadata(): Promise<Metadata> {
  const aggregates = await getPublicAggregates("ryl");
  return {
    title: "Privacy — Rewrite Your Life | Growth Impact Group",
    description: "What Rewrite Your Life stores, what it is for, and how to ask for your private code to be disconnected.",
    robots: isLaunched(aggregates) ? { index: true, follow: true } : { index: false, follow: false },
  };
}

function Item({ lead, children }: { lead: string; children: React.ReactNode }) {
  return (
    <p className="max-w-4xl text-lg leading-relaxed text-ink/90">
      <span className="font-bold text-ink">{lead}</span> {children}
    </p>
  );
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl bg-surface">
      <header className="border-b border-border px-6 py-10 sm:px-10 sm:py-14">
        <p className="font-mono text-xs font-medium tracking-widest text-muted uppercase">
          Public Outcome Record
        </p>
        <h1 className="mt-3 text-4xl font-bold text-ink">Privacy</h1>
        <p className="mt-3 font-mono text-sm text-muted">Last updated: October 8, 2026</p>
      </header>

      <div className="space-y-6 px-6 py-10 sm:px-10">
        <Item lead="We collect no personal information that identifies you.">
          No name, no email, no phone number, no address, no payment details, and no tracking or
          advertising cookies.
        </Item>
        <Item lead="What we store:">
          your 0–10 ratings, the date, and a private code made from your birthday (month and day, no
          year) and your parents&apos; first initials. The code lets us match your maps over time
          without knowing who you are. We have no way to contact you.
        </Item>
        <Item lead="Before October 8, 2026:">
          the quiz matched people by email instead. Those earlier email addresses are held under
          restricted access, used only to match those participants&apos; own start and finish maps,
          and are never shared, published, or used to contact anyone. No new email is collected.
        </Item>
        <Item lead="What it's for:">
          showing you your results, showing you what changed, and creating anonymous group averages.
        </Item>
        <Item lead="What we share:">
          individual answers are never shared or published. Group averages only, and only for groups
          of 20 or more. We never sell data or share answers with any healthcare provider, insurer,
          employer, or advertiser.
        </Item>
        <Item lead="What this is not:">
          a medical, clinical, or psychological assessment. It doesn&apos;t diagnose or screen for
          anything.
        </Item>
        <Item lead="Where it's kept:">
          with our hosting and database providers. Your answers are stored in a database on servers
          in Japan (Tokyo). Like every website, our host keeps standard security logs; these
          aren&apos;t stored with your answers.
        </Item>
        <Item lead="Your choices:">
          taking part is voluntary and you can stop at any time. To have your private code
          disconnected from your answers, email us the code.
        </Item>
        <p className="max-w-4xl text-lg font-bold text-ink">Adults only.</p>
        <Item lead="Questions:">
          <a href="mailto:growthimpactgroup@protonmail.com" className="text-primary underline">
            growthimpactgroup@protonmail.com
          </a>
        </Item>

        <div className="border-t border-border pt-6">
          <h2 className="text-2xl font-bold text-ink">How a Deletion Request Works</h2>
          <p className="mt-2 max-w-4xl text-lg leading-relaxed text-ink/90">
            The raw record of your answers is never altered or deleted — doing that would break the
            monthly blockchain fingerprint covering every record from that month, for everyone. What we
            do instead: your private code is permanently disconnected from your answers everywhere this
            page reads from. Your answers keep counting in the group figures, anonymously, exactly as
            before — they just can no longer be traced back to the code, and they can no longer be
            matched into a new before/after pair going forward. Any group figures that already included
            your pair update the next time this page refreshes.
          </p>
        </div>

        <p className="text-sm italic text-muted">Operated by Growth Impact Group LLC.</p>
      </div>

      <footer className="px-6 py-10 font-mono text-xs text-muted sm:px-10">
        <a href="/results" className="text-primary underline">
          ← Back to the Public Outcome Record
        </a>
      </footer>
    </main>
  );
}
