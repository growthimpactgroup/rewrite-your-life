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
export default function VerifyStrip() {
  return (
    <div className="border-b border-border bg-[#0f1420] px-6 py-8 font-mono text-base text-slate-200 sm:px-10">
      <p className="leading-relaxed">
        <span className="font-bold text-white">This is built to be checked by someone, and can be
        verified.</span> Every number above can be recomputed from the{" "}
        <a href="/aggregates.csv" className="text-emerald-400 underline">
          downloadable data
        </a>
        , the method is written out in full at{" "}
        <a href="/methodology" className="text-emerald-400 underline">
          /methodology
        </a>
        , and the raw dataset is fingerprinted monthly onto a public blockchain (
        <a href="/proofs" className="text-emerald-400 underline">
          proofs here
        </a>
        ). If we ever edited an answer, the break would be visible to anyone.
      </p>
    </div>
  );
}
