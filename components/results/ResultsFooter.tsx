import { CONSENT_TEXT } from "@/lib/questions";

// PLACEHOLDER — the spec calls for a "contact route" here but no real
// contact address/link exists anywhere in this codebase. Do not treat this
// as approved copy; swap in GIG's real contact info before this page goes
// live (same "unapproved, needs sign-off" pattern as ENTRY_DISCLAIMER in
// lib/questions.ts).
const CONTACT_ROUTE_PLACEHOLDER = "Questions about this record — contact Growth Impact Group.";

export default function ResultsFooter() {
  return (
    <footer className="px-6 py-10 font-mono text-xs text-muted sm:px-10">
      <p>Growth Impact Group · Rewrite Your Life</p>
      <p className="mt-2">
        This page shows group statistics only, recomputed nightly from raw participant submissions.
        No individual participant answers are ever published.
      </p>
      <p className="mt-2 max-w-2xl">{CONSENT_TEXT}</p>
      <p className="mt-2">{CONTACT_ROUTE_PLACEHOLDER}</p>
    </footer>
  );
}
