import type { Anchor } from "@/lib/anchors";
import { INSTRUMENT_SHA256, truncateHash } from "@/lib/instrument";
import { formatDate } from "./format";
import SectionHeading from "./SectionHeading";

function AnchorChain({ anchors }: { anchors: Anchor[] }) {
  if (anchors.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border px-5 py-6 text-sm text-muted">
        No anchors filed yet. The first monthly anchor (Section 9 of the build process) will appear
        here as soon as it&apos;s filed — nothing is shown until it&apos;s real.
      </div>
    );
  }

  return (
    <div className="relative space-y-4 pl-8">
      <div className="absolute top-2 bottom-2 left-[7px] w-px bg-border" aria-hidden />
      {anchors.map((a) => (
        <div key={a.date} className="relative rounded-lg border border-border bg-card p-5">
          <span className="absolute top-6 -left-8 h-3.5 w-3.5 rounded-full border-2 border-ink bg-card" aria-hidden />
          <p className="font-mono text-sm font-bold tracking-widest text-ink uppercase">
            Anchored {formatDate(a.date)} · {a.row_count} rows
          </p>
          <p className="mt-2 font-mono text-sm break-all text-muted">SHA-256 {a.sha256}</p>
          <a href={`/proofs/${a.file}`} className="mt-2 inline-block font-mono text-sm text-primary underline">
            Download proof file (.ots)
          </a>{" "}
          <span className="font-mono text-sm text-muted">— verify against the public OpenTimestamps calendars</span>
        </div>
      ))}
    </div>
  );
}

export default function VerifySection({ anchors }: { anchors: Anchor[] }) {
  return (
    <section className="border-b border-border px-6 py-10 sm:px-10 sm:py-14">
      <SectionHeading eyebrow="05 · Verify this record" title="Verify This Record" />
      <p className="mt-2 max-w-4xl text-lg leading-relaxed text-ink/90">
        This is built to be checked by someone, and can be verified. Each month, a fingerprint of the
        entire dataset {anchors.length > 0 ? "is stamped" : "will be stamped"} to a public
        blockchain. Editing or backdating a single answer afterward breaks the chain — visibly,
        permanently, and to anyone who looks.
        {anchors.length === 0 && " No month has closed yet, so there's nothing to anchor until there is."}
      </p>

      <div className="mt-6">
        <AnchorChain anchors={anchors} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-lg font-bold text-ink">The Frozen Instrument</p>
          <p className="mt-2 text-base text-ink/90">
            The exact 27 questions, locked since the first submission. Changing a word would break
            the before/after, so no word changes.{" "}
            <a href="/instrument" className="text-primary underline">
              Read all 27 questions
            </a>{" "}
            <span className="font-mono text-sm text-muted">· SHA-256 {truncateHash(INSTRUMENT_SHA256)}</span>
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-lg font-bold text-ink">The Group Data</p>
          <p className="mt-2 text-base text-ink/90">
            The anonymized table behind this page, downloadable. Recompute every number on this page
            yourself.{" "}
            <a href="/aggregates.csv" className="text-primary underline">
              aggregates.csv
            </a>{" "}
            ·{" "}
            <a href="/aggregates.json" className="text-primary underline">
              aggregates.json
            </a>
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-lg font-bold text-ink">What Is Never Published</p>
          <p className="mt-2 text-base text-ink/90">
            Individual answers. Ever. Email addresses are stored solely to match a person&apos;s Day 0
            map to their Week 10 map — the system has no ability to send mail of any kind.
          </p>
        </div>
      </div>
    </section>
  );
}
