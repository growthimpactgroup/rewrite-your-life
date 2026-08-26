import { Montserrat } from "next/font/google";

// Scoped to this route group only (/results, /instrument, /proofs, etc.)
// via a Next.js route group — does not touch the survey flow's font, which
// stays on the system font stack defined in app/globals.css.
//
// 2026-08-26, at Frances's request: Montserrat now applies to literally
// everything on these pages, including elements still using Tailwind's
// font-mono utility (data figures, hashes, eyebrow labels) — previously
// those were deliberately left on the monospace stack. Tailwind's
// font-mono utility reads the --font-mono CSS variable, so overriding that
// variable on this wrapping div (rather than hunting down every font-mono
// class across every component) flips all of them at once, in one place.
const montserrat = Montserrat({
  subsets: ["latin"],
});

export default function PublicRecordLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={montserrat.className}
      style={{ ["--font-mono" as string]: montserrat.style.fontFamily }}
    >
      {children}
    </div>
  );
}
