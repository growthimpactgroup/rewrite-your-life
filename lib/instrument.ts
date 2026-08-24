import { createHash } from "crypto";
import { QUESTIONS } from "./questions";

// The frozen instrument (Section 2: "Frozen wording everywhere"). The hash
// is computed from just the wording that matters — id, text, example — not
// internal scoring fields (domain/reverse/scale), so a future scoring-logic
// change (explicitly allowed, see lib/scoring.ts's header comment) can never
// silently change this hash. Computed once at module load.

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
