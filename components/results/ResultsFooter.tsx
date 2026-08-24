import {
  BLOCK_1_ABOUT_THIS_RECORD,
  BLOCK_2_RESULTS_DISCLOSURE,
  BLOCK_3_NOT_PROFESSIONAL_ADVICE,
  BLOCK_4_CONSENT_AND_PRIVACY,
} from "@/lib/copyBlocks";

// Change Order 01, Phase 6 — Target H. Four columns (about this record /
// results disclosure / not professional advice / participant consent),
// each Copy Block 1-4 verbatim (Operating Rule 4), plus a contact line.
// [record@domain] and [registered address] stay bracketed — Operating
// Rule 5: never invent a placeholder value; collect it for the Final
// Report instead. Do not treat these brackets as a bug to fix.
function ParticipantConsent() {
  const [before, after] = BLOCK_4_CONSENT_AND_PRIVACY.split("privacy notice");
  return (
    <p className="leading-relaxed">
      {before}
      <a href="/privacy" className="text-ink underline">
        privacy notice
      </a>
      {after}
    </p>
  );
}

export default function ResultsFooter() {
  return (
    <footer className="border-t-4 border-ink px-6 py-10 font-mono text-xs text-muted sm:px-10">
      <p className="text-xs font-semibold tracking-widest text-ink uppercase">About this record</p>
      <p className="mt-2 max-w-3xl leading-relaxed">{BLOCK_1_ABOUT_THIS_RECORD}</p>

      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold tracking-widest text-ink uppercase">Results disclosure</p>
          <p className="mt-2 leading-relaxed">{BLOCK_2_RESULTS_DISCLOSURE}</p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-widest text-ink uppercase">Not professional advice</p>
          <p className="mt-2 leading-relaxed">{BLOCK_3_NOT_PROFESSIONAL_ADVICE}</p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-widest text-ink uppercase">Participant consent</p>
          <div className="mt-2">
            <ParticipantConsent />
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-border pt-6">
        <p className="text-xs font-semibold tracking-widest text-ink uppercase">Contact</p>
        <p className="mt-2 leading-relaxed">
          Questions about this record, the methodology, or a deletion request:
        </p>
        <p className="mt-1">
          <span className="font-bold text-ink">[record@domain]</span> · Growth Impact Group, LLC ·{" "}
          [registered address]
        </p>
        <p className="mt-3">
          <a href="/terms" className="text-ink underline">
            Terms of use
          </a>{" "}
          ·{" "}
          <a href="/privacy" className="text-ink underline">
            Privacy
          </a>{" "}
          ·{" "}
          <a href="/methodology" className="text-ink underline">
            Methodology
          </a>
        </p>
      </div>
    </footer>
  );
}
