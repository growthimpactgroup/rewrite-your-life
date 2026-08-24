// Change Order 01, Phase 1 — permanent, cannot be dismissed, cannot be
// mistaken for the SampleBanner (different wording, different color) since
// this means something different: not "no real data yet," but "this data is
// fake, on purpose, for design review."
export default function PreviewBanner() {
  return (
    <div className="border-b border-amber-400 bg-amber-200 px-6 py-3 text-center text-sm font-bold text-amber-950">
      PREVIEW — SEEDED DATA, NOT REAL RESULTS
    </div>
  );
}
