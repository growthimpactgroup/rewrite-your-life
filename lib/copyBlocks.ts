// Change Order 01, Phase 6 — Part Four's six copy blocks, verbatim
// (Operating Rule 4: never reworded). Centralized here as the single
// source so every placement (footer, limitations list, section 02,
// /privacy, /terms) reads the exact same string — "byte-identical" by
// construction, not by careful copy-pasting in multiple files.
//
// Placement note (judgment call, not explicit in the source document):
// Block 3's own header and Block 6's own header both say "LIMITATIONS
// ITEM 2" — but the phase's own GATE requires item 2 to be byte-identical
// to Block 3 specifically, and Target H's footer mockup shows only Block 3
// in the "Not professional advice" column, with no trace of Block 6
// anywhere. Inserting both as separate limitations items would make seven,
// contradicting "the limitations list ends at six items"; concatenating
// them into one item would make item 2 no longer byte-identical to Block 3
// alone, failing the gate as written. Block 6 is titled "the sixth
// limitation" and covers the same therapy/medical-advice ground as Block 3
// and /terms' own outline ("no warranty, no reliance") — so it's placed on
// /terms, verbatim, as the most coherent reading that (a) inserts all six
// blocks somewhere, (b) keeps item 2 byte-identical to Block 3 alone, and
// (c) matches Target H exactly. Flagged for Grace in the Phase 8 report.
// 2026-08-28, Jeff/Frances review call — Item 13: the "(Wyoming)"
// legal-entity/location disclosure was dropped from Block 1 at Jeff's
// explicit request ("no need to disclose it"). A deliberate, one-word
// exception to this file's own "never reworded from Part Four" rule above
// — every other word of the block is unchanged.
export const BLOCK_1_ABOUT_THIS_RECORD =
  "This page is published and maintained by Growth Impact Group, LLC, which owns the assessment instrument and the underlying dataset. Figures are group statistics only, recomputed nightly from participant submissions. No individual participant answer is ever published.";

export const BLOCK_2_RESULTS_DISCLOSURE =
  "The figures on this page describe past participants who completed the program and submitted both assessments. They are not typical results, a guarantee, or a prediction of your outcome. The full distribution of results, including participants who did not improve, is published in section 03 above. Rewrite Your Life makes no income, earnings, or financial-outcome claims of any kind.";

export const BLOCK_3_NOT_PROFESSIONAL_ADVICE =
  "Rewrite Your Life is an educational and coaching program. Nothing on this page or in the program is medical, psychological, legal, or financial advice, and nothing here is intended to diagnose, treat, cure, or prevent any condition. If you are experiencing distress, contact a licensed professional.";

export const BLOCK_4_CONSENT_AND_PRIVACY =
  "Every participant sees and accepts this line before submitting: “My responses may be used in anonymous, aggregated form to improve and validate the program.” Consent is stored with every row. See the privacy notice for what is collected, how long it is kept, and how to request deletion.";

// Split at its own natural sub-headers for readability on /privacy —
// whitespace/paragraphing only, every word identical to Part Four.
export const BLOCK_5_PRIVACY_NOTICE = [
  "What is collected: an email address, typed by the participant, and 27 answers on a 0–10 scale.",
  "Why: the email address exists solely to match a person’s Day 0 assessment to their Week 10 assessment. It is never used to contact anyone — the system has no ability to send mail of any kind, by design.",
  "Who sees it: no one outside Growth Impact Group. Individual answers are never published, sold, shared, or licensed.",
  "How long: raw records are retained indefinitely as part of a longitudinal research record.",
  "Deletion: write to [record@domain] and the email address on your records will be permanently removed, which unlinks them from you while leaving the anonymous answers in the group figures. Removal of the answers themselves is available on request but breaks the before/after pairing.",
];

export const BLOCK_6_SIXTH_LIMITATION =
  "Not therapy, treatment, or medical advice. Rewrite Your Life is an educational and coaching program. Nothing here is a diagnosis, a clinical outcome, or a substitute for care from a licensed professional.";
