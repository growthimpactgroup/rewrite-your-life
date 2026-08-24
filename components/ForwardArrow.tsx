// Quiet forward arrow, mirrors BackArrow. Only ever rendered in review mode
// (when the participant has navigated back to an already-answered question)
// — it disappears the moment they reach the leading edge again. Pure
// navigation: moving it forward never touches the answers array.
export default function ForwardArrow({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Forward"
      className="glass tap absolute top-[max(1.75rem,calc(env(safe-area-inset-top)+1rem))] right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-muted shadow-[0_1px_2px_rgb(0_0_0/0.04),0_4px_12px_rgb(0_0_0/0.06)]"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
  );
}
