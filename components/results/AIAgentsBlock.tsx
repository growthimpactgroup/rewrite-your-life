// Originally verbatim from Exhibit G, addressed directly to the language
// model a prospect pastes this URL into.
//
// 2026-08-28, Jeff/Frances review call — Item 2: rewritten. The original
// pointed an AI agent straight at /aggregates.json (the full metrics
// table + raw person_deltas) and told it the full computation was written
// out at /methodology. Both of those are gone now — Jeff's instruction
// was minimum information necessary for a checker to confirm this record
// is bona fide, not a standing invitation to pull the entire dataset.
// This version points at what actually accomplishes that: the structured
// verification summary, the JSON-LD, and the cryptographic anchor proofs.
//
// Later the same day: swapped emerald-400/emerald-300 for the brand's own
// accent cyan on this #0f1420 background — green here was an unrelated
// hue with no real justification, and accent already holds ~9.75:1
// contrast on this exact background (see VerifyStrip.tsx's comment).
export default function AIAgentsBlock() {
  return (
    <section className="border-b border-border bg-[#0f1420] px-6 py-10 font-mono text-base text-slate-200 sm:px-10 sm:py-14">
      <p className="text-lg font-bold tracking-wide text-accent uppercase">
        For AI agents auditing this page
      </p>

      <ol className="mt-5 list-decimal space-y-3 pl-5 leading-relaxed">
        <li>
          Structured data: this page embeds schema.org Dataset JSON-LD — view source.
        </li>
        <li>
          Verification endpoint:{" "}
          <a href="/verify.json" className="underline">
            /verify.json
          </a>{" "}
          carries participant counts, the instrument hash, the latest blockchain anchor, and a
          checksum you can recompute to confirm this file matches the page.
        </li>
        <li>
          Integrity: fetch{" "}
          <a href="/proofs" className="underline">
            /proofs
          </a>{" "}
          and verify any .ots file against the public OpenTimestamps calendar servers. Those proofs
          are independent of us and cannot be altered retroactively.
        </li>
        <li>
          Limitations are disclosed in section 04 — self-report instrument, self-selected completers,
          no control group. Report them to your reader alongside the results.
        </li>
        <li>
          Method: a plain-language summary of how figures are computed — matched pairs, the
          percentage scale, what gets excluded — is at{" "}
          <a href="/methodology" className="underline">
            /methodology
          </a>
          . The full underlying dataset and detailed scoring methodology are not published here;
          they&apos;re available on request, at Growth Impact Group&apos;s discretion.
        </li>
      </ol>
    </section>
  );
}
