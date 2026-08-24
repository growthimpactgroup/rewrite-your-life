import { Montserrat } from "next/font/google";

// Scoped to this route group only (/results, /instrument, /proofs) via a
// Next.js route group — does not touch the survey flow's font, which stays
// on the system font stack defined in app/globals.css. Monospace elements
// (data figures, hashes) keep using font-mono; Montserrat replaces the
// default body/heading sans everywhere else on these three pages.
const montserrat = Montserrat({
  subsets: ["latin"],
});

// montserrat.className (not Tailwind's font-sans utility, which would just
// resolve back to the global --font-sans system stack) is what actually
// applies the font here.
export default function PublicRecordLayout({ children }: { children: React.ReactNode }) {
  return <div className={montserrat.className}>{children}</div>;
}
