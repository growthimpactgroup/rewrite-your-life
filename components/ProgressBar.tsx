export default function ProgressBar({ progress }: { progress: number }) {
  const clamped = Math.min(100, Math.max(0, progress));
  return (
    <div
      className="fixed inset-x-4 top-[max(0.75rem,env(safe-area-inset-top))] z-50 mx-auto h-1.5 max-w-sm overflow-hidden rounded-full bg-black/[0.06] sm:max-w-md lg:max-w-xl dark:bg-white/[0.08]"
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
