import { createHash } from "crypto";
import { QUESTIONS } from "./questions";

// The frozen instrument (Section 2: "Frozen wording everywhere"). The hash
// is computed from just the wording that matters — id, text, example — not
// internal scoring fields (domain/reverse/scale), so a future scoring-logic
// change (explicitly allowed, see lib/scoring.ts's header comment) can never
// silently change this hash. Computed once at module load.
//
// 2026-09-22: this property is exactly what let items 19/20/21/25/27 get an
// answer-option relabel (post-launch participant feedback — button sets that
// didn't semantically match their questions) without bumping this hash or
// breaking comparability with existing submissions. See lib/questions.ts's
// "Answer-option revision 2" comment for the full rationale.

export interface FrozenQuestion {
  id: number;
  text: string;
  example?: string;
}

export const FROZEN_QUESTIONS: FrozenQuestion[] = QUESTIONS.map((q) => ({
  id: q.id,
  text: q.text,
  ...(q.example ? { example: q.example } : {}),
}));

export const INSTRUMENT_SHA256 = createHash("sha256")
  .update(JSON.stringify(FROZEN_QUESTIONS))
  .digest("hex");

export function truncateHash(hash: string): string {
  return `${hash.slice(0, 4)}…${hash.slice(-4)}`;
}
