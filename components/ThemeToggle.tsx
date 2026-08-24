"use client";

const STORAGE_KEY = "ryl-theme";

// Manual-only toggle — never follows the OS. Persisted so the choice
// survives a reload/return visit. Fixed bottom-right, deliberately not
// top-right, so it never collides with BackArrow/ForwardArrow, which both
// live in the top corners during the question flow.
//
// No React state here on purpose: the icon swap is pure CSS (dark:hidden /
// hidden dark:block), reacting directly to the data-theme attribute the
// beforeInteractive script already set before hydration. Tracking that
// attribute in useState would need an effect to read it after mount, which
// both trips the set-state-in-effect rule and risks a hydration mismatch
// for a returning dark-mode visitor (server always renders "light").
export default function ThemeToggle() {
  function toggle() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const next = !isDark;
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Private-browsing / storage-disabled — the toggle still works for
      // this page view, it just won't persist across a reload.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle light and dark theme"
      className="glass tap fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 flex h-10 w-10 items-center justify-center rounded-full text-ink shadow-[0_1px_2px_rgb(0_0_0/0.04),0_4px_12px_rgb(0_0_0/0.06)]"
    >
      {/* Moon: shown in light mode, tap to go dark. */}
      <svg
        className="block dark:hidden"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
      {/* Sun: shown in dark mode, tap to go light. */}
      <svg
        className="hidden dark:block"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    </button>
  );
}
