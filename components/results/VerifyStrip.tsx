// Change Order 01, Phase 5 — a verification strip directly beneath the dot
// plot, where the eyes already are, not only at the bottom of the page.
// Exactly three links, nothing else — the full verification section
// (anchor chain, instrument hash, etc.) still lives further down for
// anyone who wants the complete picture; this is the fast version.
//
// 2026-08-28, Jeff/Frances review call — Item 10: dropped the "don't trust
// this page" framing ("we don't need to keep saying who doesn't trust
// us"). Replacement direction from the call: state that the page is built
// to be checked, not that the reader shouldn't trust it.
//
// Same call, Item 2: the "downloadable data" link (aggregates.csv) is
// gone — replaced with /verify.json, a structured summary of counts and
// hashes rather than the dataset itself. See VerifySection.tsx for the
// full explanation.
export default function VerifyStrip() {
  return (
    <div className="border-b border-border bg-[#0f1420] px-6 py-8 font-mono text-base text-slate-200 sm:px-10">
      <p className="leading-relaxed">
        <span className="font-bold text-white">This is built to be checked by someone, and can be
        verified.</span> Every figure above can be confirmed against{" "}
        <a href="/verify.json" className="text-emerald-400 underline">
          verify.json
        </a>
        , the raw dataset is fingerprinted monthly onto a public blockchain (
        <a href="/proofs" className="text-emerald-400 underline">
          proofs here
        </a>
        ), and the method is summarized at{" "}
        <a href="/methodology" className="text-emerald-400 underline">
          /methodology
        </a>
        . If we ever edited an answer, the break would be visible to anyone.
      </p>
    </div>
  );
}
