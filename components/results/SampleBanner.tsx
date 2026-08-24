// Code-controlled per Section 2: renders only when no nightly build has run
// yet (getPublicAggregates returns null). Never a manual flag — disappears
// the moment real aggregates exist.
export default function SampleBanner() {
  return (
    <div className="border-b border-amber-300 bg-amber-100 px-6 py-3 text-center text-sm font-medium text-amber-900">
      SAMPLE — this page is not yet showing live data. It will replace this banner automatically once the
      first nightly build completes.
    </div>
  );
}
