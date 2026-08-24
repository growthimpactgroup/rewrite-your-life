// Scoring layer — reads raw answers, computes display values. This file is
// intentionally the ONLY place scoring math lives. It never touches the
// database and nothing here is persisted: raw items in Supabase stay the
// permanent record, and every number on a results screen is recomputed from
// them on the fly. That means the formulas below can change, be replaced, or
// be removed entirely at any time without migrating or losing a single row —
// unlike the frozen question wording in lib/questions.ts, this is safe to
// revise.
//
// Method: POMP (Percentage of Maximum Possible) scoring — the standard way
// to score an arbitrary Likert-type instrument with no external norm group.
// Bundle in use: simple domain/anchor/AI-index percentages, a plain
// later-minus-earlier delta for before/after, and the brief's original
// straight-line exclusion rule. See conversation history for the fuller
// option set (Reliable Change Index, meta-clusters, banding, etc.) — all
// upgradeable later from this same raw data.

import { QUESTIONS, TOTAL_QUESTIONS } from "./questions";

export const DOMAIN_ORDER = [
  "CLEAR THINKING",
  "EMOTIONAL",
  "ADVERSITY",
  "FRAME",
  "LEARNING",
  "SITUATIONAL",
  "PRESENCE",
  "PURPOSE",
  "EXECUTION",
] as const;

export const DOMAIN_LABELS: Record<string, string> = {
  "CLEAR THINKING": "Clear Thinking",
  EMOTIONAL: "Emotional Steadiness",
  ADVERSITY: "Adversity Recovery",
  FRAME: "Frame Control",
  LEARNING: "Learning Agility",
  SITUATIONAL: "Situational Awareness",
  PRESENCE: "Presence",
  PURPOSE: "Purpose",
  EXECUTION: "Execution",
};

export interface DomainScore {
  domain: string;
  label: string;
  percent: number; // 0–100, POMP
}

export interface AnchorScore {
  id: number;
  raw: number; // 0–10, shown as X/10 — never as a percentage (Screen E v2 spec)
}

export interface ScoreSummary {
  domains: DomainScore[];
  anchors: AnchorScore[];
  aiIndexPercent: number;
  qaiPercent: number; // item 22 alone — its own row under AI Orchestration
  // All domains tied at the max/min, not just one — a 2-way tie renders as
  // "A & B", a 3+ way tie as a pluralized list (Screen E v2 spec).
  signature: DomainScore[];
  trainingFocus: DomainScore[];
  straightLined: boolean;
}

/** Reverse-scored items (8, 14) become 10 − answer; everything else passes through. */
function scoredValue(itemId: number, raw: number): number {
  const q = QUESTIONS.find((q) => q.id === itemId);
  return q?.reverse ? 10 - raw : raw;
}

export function scoreDomains(items: number[]): DomainScore[] {
  return DOMAIN_ORDER.map((domain) => {
    const domainQuestions = QUESTIONS.filter((q) => q.domain === domain);
    const sum = domainQuestions.reduce(
      (acc, q) => acc + scoredValue(q.id, items[q.id - 1]),
      0,
    );
    const percent = (sum / (domainQuestions.length * 10)) * 100;
    return { domain, label: DOMAIN_LABELS[domain], percent: Math.round(percent) };
  });
}

export function scoreAnchors(items: number[]): AnchorScore[] {
  const anchorQuestions = QUESTIONS.filter((q) => q.domain === "LIFE ANCHORS");
  return anchorQuestions.map((q) => ({ id: q.id, raw: items[q.id - 1] }));
}

export function scoreAIIndex(items: number[]): number {
  const aiQuestions = QUESTIONS.filter((q) => q.domain === "AI ORCHESTRATION INDEX");
  const sum = aiQuestions.reduce((acc, q) => acc + items[q.id - 1], 0);
  return Math.round((sum / (aiQuestions.length * 10)) * 100);
}

/** Q-AI (item 22) alone, on its own row under AI Orchestration. */
export function scoreQAI(items: number[]): number {
  return Math.round((items[21] / 10) * 100);
}

/**
 * Longstring / careless-response check (Meade & Craig, 2012): 10+
 * consecutive identical raw answers, where the run spans at least one of
 * the reverse-scored items (8, 14). A genuine respondent adjusts on a
 * reverse item; someone who doesn't is a strong tell they weren't reading.
 * This never hides or drops the row — it's informational only, matching
 * the brief's "keep the row, exclude from aggregates" rule (that exclusion
 * applies to future cross-user aggregate rollups, not to a person's own
 * results, so it does not affect what's shown on this screen).
 */
export function isStraightLined(items: number[]): boolean {
  const reverseIndexes = new Set([7, 13]); // items 8 and 14, 0-based
  let runStart = 0;
  for (let i = 1; i <= items.length; i++) {
    if (i === items.length || items[i] !== items[runStart]) {
      const runLength = i - runStart;
      if (runLength >= 10) {
        for (let j = runStart; j < i; j++) {
          if (reverseIndexes.has(j)) return true;
        }
      }
      runStart = i;
    }
  }
  return false;
}

export function summarizeScore(items: number[]): ScoreSummary {
  const domains = scoreDomains(items);
  const anchors = scoreAnchors(items);
  const aiIndexPercent = scoreAIIndex(items);
  const qaiPercent = scoreQAI(items);

  const maxPercent = Math.max(...domains.map((d) => d.percent));
  const minPercent = Math.min(...domains.map((d) => d.percent));
  const signature = domains.filter((d) => d.percent === maxPercent);
  const trainingFocus = domains.filter((d) => d.percent === minPercent);

  return {
    domains,
    anchors,
    aiIndexPercent,
    qaiPercent,
    signature,
    trainingFocus,
    straightLined: isStraightLined(items),
  };
}

export interface DeltaEntry {
  key: string;
  label: string;
  currentPercent: number;
  previousPercent: number;
  pointsChange: number;
  percentChange: number | null; // null when previous was 0 (avoid divide-by-zero)
}

/** Simple later-minus-earlier delta (bundle option B3 — upgrade path to a
 * Reliable Change Index once enough real retake data exists to estimate
 * measurement error from). */
export function computeDelta(currentPercent: number, previousPercent: number): {
  pointsChange: number;
  percentChange: number | null;
} {
  const pointsChange = currentPercent - previousPercent;
  const percentChange =
    previousPercent === 0 ? null : Math.round((pointsChange / previousPercent) * 100);
  return { pointsChange, percentChange };
}

export function buildDeltas(current: ScoreSummary, previous: ScoreSummary): DeltaEntry[] {
  const entries: DeltaEntry[] = current.domains.map((d, i) => {
    const prev = previous.domains[i];
    const { pointsChange, percentChange } = computeDelta(d.percent, prev.percent);
    return {
      key: d.domain,
      label: d.label,
      currentPercent: d.percent,
      previousPercent: prev.percent,
      pointsChange,
      percentChange,
    };
  });

  const aiDelta = computeDelta(current.aiIndexPercent, previous.aiIndexPercent);
  entries.push({
    key: "AI_INDEX",
    label: "AI Orchestration",
    currentPercent: current.aiIndexPercent,
    previousPercent: previous.aiIndexPercent,
    pointsChange: aiDelta.pointsChange,
    percentChange: aiDelta.percentChange,
  });

  return entries;
}

export function assertValidItems(items: unknown): items is number[] {
  return (
    Array.isArray(items) &&
    items.length === TOTAL_QUESTIONS &&
    items.every((v) => typeof v === "number" && [0, 3, 5, 8, 10].includes(v))
  );
}
