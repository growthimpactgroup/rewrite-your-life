// Proportional horizontal bar, Exhibit C: width relative to the largest
// |delta_pts| among the visible domain rows, green for gains, red for
// declines. A page-scoped exception to the app's "red is reserved for
// clinical disclosures" rule — see the Phase C plan's Design decision #6.
export default function DeltaBar({ deltaPts, maxAbsDeltaPts }: { deltaPts: number; maxAbsDeltaPts: number }) {
  const widthPct = maxAbsDeltaPts === 0 ? 0 : (Math.abs(deltaPts) / maxAbsDeltaPts) * 100;
  const isDecline = deltaPts < 0;

  return (
    <div className="h-3 w-full min-w-[60px] overflow-hidden rounded-sm bg-border/60 sm:min-w-[100px]">
      <div
        className={`h-full rounded-sm ${isDecline ? "bg-red-600" : "bg-emerald-700"}`}
        style={{ width: `${Math.max(widthPct, 4)}%` }}
      />
    </div>
  );
}
