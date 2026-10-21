import { anchorProofUrl, type Anchor } from "@/lib/anchors";
import { INSTRUMENT_SHA256, truncateHash } from "@/lib/instrument";
import { formatDate } from "./format";
import SectionHeading from "./SectionHeading";

function SinceAnchorCard({ anchor }: { anchor: Anchor | null }) {
  if (!anchor) {
    return (
      <div className="rounded-lg border border-dashed border-border px-5 py-6 text-sm text-muted">
        The fingerprint of responses since October 19, 2026 has not been filed yet.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="font-mono text-sm font-bold tracking-widest text-ink uppercase">
        Responses since Oct 19, 2026 · {anchor.row_count} rows · Anchored {formatDate(anchor.date)}
      </p>
      <p className="mt-2 font-mono text-sm break-all text-muted">SHA-256 {anchor.sha256}</p>
      <a href={anchorProofUrl(anchor.file)} className="mt-2 inline-block font-mono text-sm text-primary underline">
        Download proof file (.ots)
      </a>{" "}
      <span className="font-mono text-sm text-muted">— verify against the public OpenTimestamps calendars</span>
    </div>
  );
}

export default function VerifySection({ sinceAnchor }: { sinceAnchor: Anchor | null }) {
  return (
    <section className="border-b border-border px-6 py-10 sm:px-10 sm:py-14">
      <SectionHeading eyebrow="05 · Verify this record" title="Verify This Record" />
      <p className="mt-2 max-w-4xl text-lg leading-relaxed text-ink/90">
        This is built to be checked by someone, and can be verified. The figures on this page use only
        responses recorded from October 19, 2026 (12:00 AM Pacific) onward. A fingerprint of exactly
        those responses is stamped to a public blockchain. Editing or backdating a single answer
        afterward breaks the chain — visibly, permanently, and to anyone who looks.
      </p>

      <div className="mt-6">
        <SinceAnchorCard anchor={sinceAnchor} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
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

        {/* 2026-08-28, Jeff/Frances review call — Item 2: the full data
            export (aggregates.csv/.json) is retired. /verify.json is a
            verification summary, not a data export — counts and hashes an
            automated checker can use to confirm this record is real,
            without republishing the underlying dataset. Full data is on
            request, at Growth Impact Group's discretion. */}
        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-lg font-bold text-ink">Machine-Readable Verification</p>
          <p className="mt-2 text-base text-ink/90">
            Counts, hashes, and the latest anchor, in one structured file — built for an automated
            checker to confirm this record on its own.{" "}
            <a href="/verify.json" className="text-primary underline">
              verify.json
            </a>
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-lg font-bold text-ink">The Full Dataset</p>
          <p className="mt-2 text-base text-ink/90">
            The group data itself is not published as a download. Full data available upon request —
            disclosed at Growth Impact Group&apos;s discretion. Contact{" "}
            <a href="mailto:growthimpactgroup@protonmail.com" className="font-bold text-ink underline">
              growthimpactgroup@protonmail.com
            </a>
            .
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <p className="text-lg font-bold text-ink">What Is Never Published</p>
          <p className="mt-2 text-base text-ink/90">
            Individual answers. Ever. A private code is stored solely to match a person&apos;s Day 0
            map to their Week 10 map — there is no name or email, and nothing to contact anyone with.
          </p>
        </div>
      </div>
    </section>
  );
}
