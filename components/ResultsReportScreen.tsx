"use client";

import { useEffect, useMemo, useState } from "react";
import { buildDeltas, computeDelta, summarizeScore } from "@/lib/scoring";
import { Phase, DECLINE_RESULTS_NOTE } from "@/lib/questions";
import { generateReportPdf, JourneyPoint } from "@/lib/pdfReport";
import {
  OPENING_FRAME_LINES,
  SHAPE_TITLE_DEFAULT,
  SHAPE_TITLE_WEEK10,
  WEEK10_SUBHEAD,
  selectHeadline,
  SIGNATURE_STRENGTH_COPY,
  TRAINING_FOCUS_COPY,
  formatTieList,
  cardTitle,
  ANCHOR_LABELS,
  ANCHOR_CAPTION,
  AI_ORCHESTRATION_CAPTION,
  CLOSING_LINE,
  UNMATCHED_RETAKE_NOTE,
  CONTINUITY_HEADLINE,
  CONTINUITY_BODY,
  CONTINUITY_WEEK10_PREFIX,
  CONTINUITY_CLOSING,
  THE_NINE_TITLE,
  DOES_WELL_BUCKET_TITLE,
  GROWTH_BUCKET_TITLE,
  SCORE_SCALE_EXPLANATION,
  ANCHOR_INTERPRETATIONS,
  AI_ORCHESTRATION_INTERPRETATION,
  QAI_INTERPRETATION,
  QAI_SUBLABEL,
  RESULTS_DISCLOSURE,
  SAVE_YOUR_COPY_NOTE,
  DECLINED_SAVE_NOW_WARNING,
  rankDomains,
  formatElapsed,
  changeLabel,
  buildJourneySummary,
} from "@/lib/resultsCopy";
import ScreenContainer from "./ScreenContainer";
import RedNotice from "./RedNotice";
import FormattedText from "./FormattedText";

interface Submission {
  createdAt: string;
  phase: string;
  items: number[];
  unmatchedRetake?: boolean;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Never red, anywhere on this screen — declines render neutral grey, same
// as "no change". Only a real gain gets color. Unit matches whatever's
// shown next to it: "%" for domains/AI, "" (raw) for the /10 anchors.
function DeltaBadge({ points, unit = "%" }: { points: number; unit?: string }) {
  if (points === 0) {
    return (
      <span className="rounded-full bg-border px-2 py-0.5 text-[13px] font-medium text-muted">
        No change
      </span>
    );
  }
  const positive = points > 0;
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[13px] font-semibold tabular-nums ${
        positive
          ? "bg-green-500/15 text-green-700 dark:bg-green-500/20 dark:text-green-400"
          : "bg-border text-muted"
      }`}
    >
      {positive ? "+" : ""}
      {points}
      {unit}
    </span>
  );
}

// Two-column Before/Now comparison + a bolded change line, shown under a
// row only when a baseline exists (the comparison/retake view). Replaces
// an earlier long-sentence version (2026-08-11 feedback: a full sentence
// per row was harder to scan than a simple before/after readout).
// Two-column Before/Now by default. When a middle checkpoint is passed
// (the week-10 "Finish my Journey" screen, which has a real second data
// point from the retake) this becomes a three-column First/Second/Now grid
// instead of silently dropping the middle submission the way the old
// current-vs-first-only comparison did.
function ComparisonGrid({
  prevValue,
  prevDate,
  midValue,
  midDate,
  currentValue,
  currentDate,
  pointsChange,
  unit,
}: {
  prevValue: string;
  prevDate: string;
  midValue?: string;
  midDate?: string;
  currentValue: string;
  currentDate: string;
  pointsChange: number;
  unit: string;
}) {
  const hasMid = midValue !== undefined && midDate !== undefined;
  return (
    <div className="mt-3">
      <div className={`grid gap-2 ${hasMid ? "grid-cols-3" : "grid-cols-2"}`}>
        <div className="rounded-lg bg-border/40 px-2 py-2 text-center">
          <p className="text-[10.5px] font-medium tracking-wide text-muted uppercase">
            {hasMid ? "First" : "Before"}
          </p>
          <p className="text-[10.5px] text-muted">{formatDate(prevDate)}</p>
          <p className="mt-0.5 text-[15px] font-semibold text-ink">{prevValue}</p>
        </div>
        {hasMid && (
          <div className="rounded-lg bg-border/40 px-2 py-2 text-center">
            <p className="text-[10.5px] font-medium tracking-wide text-muted uppercase">Second</p>
            <p className="text-[10.5px] text-muted">{formatDate(midDate!)}</p>
            <p className="mt-0.5 text-[15px] font-semibold text-ink">{midValue}</p>
          </div>
        )}
        <div className="rounded-lg bg-border/40 px-2 py-2 text-center">
          <p className="text-[10.5px] font-medium tracking-wide text-muted uppercase">Now</p>
          <p className="text-[10.5px] text-muted">{formatDate(currentDate)}</p>
          <p className="mt-0.5 text-[15px] font-semibold text-ink">{currentValue}</p>
        </div>
      </div>
      <p className="mt-1.5 text-center text-[14px] font-bold text-ink">
        {changeLabel(pointsChange, unit)} since {formatDate(prevDate)}
      </p>
    </div>
  );
}

function DomainBarRow({
  label,
  sublabel,
  percent,
  delta,
  comparison,
  interpretation,
}: {
  label: string;
  sublabel?: string;
  percent: number;
  delta?: number;
  comparison?: {
    prevPercent: number;
    prevDate: string;
    midPercent?: number;
    midDate?: string;
    currentDate: string;
  };
  interpretation?: string;
}) {
  return (
    <div className="py-4">
      <div className="flex items-start justify-between gap-2">
        <span>
          <span className="block text-[18px] font-bold text-ink">{label}</span>
          {sublabel && (
            <span className="mt-0.5 block text-[12px] font-normal text-muted">{sublabel}</span>
          )}
        </span>
        <div className="flex flex-shrink-0 items-center gap-2">
          <span className="text-[15px] font-medium tabular-nums text-muted">{percent}%</span>
          {delta !== undefined && <DeltaBadge points={delta} unit="%" />}
        </div>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        />
      </div>
      {comparison && delta !== undefined && (
        <ComparisonGrid
          prevValue={`${comparison.prevPercent}%`}
          prevDate={comparison.prevDate}
          midValue={comparison.midPercent !== undefined ? `${comparison.midPercent}%` : undefined}
          midDate={comparison.midDate}
          currentValue={`${percent}%`}
          currentDate={comparison.currentDate}
          pointsChange={delta}
          unit="%"
        />
      )}
      {interpretation && (
        <p className="mt-3 text-[15px] leading-relaxed text-ink/85">
          <FormattedText text={interpretation} />
        </p>
      )}
    </div>
  );
}

function AnchorRow({
  label,
  raw,
  delta,
  comparison,
  interpretation,
}: {
  label: string;
  raw: number;
  delta?: number;
  comparison?: {
    prevRaw: number;
    prevDate: string;
    midRaw?: number;
    midDate?: string;
    currentDate: string;
  };
  interpretation?: string;
}) {
  return (
    <div className="glass rounded-2xl px-4 py-3">
      <div className="flex items-center justify-between">
        <span className="text-[18px] font-medium text-ink">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[19px] font-semibold tabular-nums text-ink">
            {raw} out of 10
          </span>
          {delta !== undefined && <DeltaBadge points={delta} unit="" />}
        </div>
      </div>
      {comparison && delta !== undefined && (
        <ComparisonGrid
          prevValue={`${comparison.prevRaw} out of 10`}
          prevDate={comparison.prevDate}
          midValue={comparison.midRaw !== undefined ? `${comparison.midRaw} out of 10` : undefined}
          midDate={comparison.midDate}
          currentValue={`${raw} out of 10`}
          currentDate={comparison.currentDate}
          pointsChange={delta}
          unit=""
        />
      )}
      {interpretation && (
        <p className="mt-2.5 text-[14px] leading-relaxed text-ink/85">
          <FormattedText text={interpretation} />
        </p>
      )}
    </div>
  );
}

// A 2-way tie reads fine as "A & B". A 3+ way tie as one comma-run-on
// sentence got long and hard to scan (2026-08-11 feedback) — switch to an
// actual bulleted list once there's more than two.
function TieList({ labels }: { labels: string[] }) {
  if (labels.length <= 2) {
    return <p className="mt-1 text-[19px] font-semibold text-ink">{formatTieList(labels)}</p>;
  }
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-left text-[17px] font-semibold text-ink">
      {labels.map((label) => (
        <li key={label}>{label}</li>
      ))}
    </ul>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-8 text-[13px] font-semibold tracking-wide text-muted uppercase">
      {children}
    </p>
  );
}

// Jeff review call, 2026-08-11: "bold key phrases/headers to improve
// scannability" — these two bucket headers are the main scan points on the
// whole screen. Banner treatment (filled background, not just bold text) so
// which section you're reading is obvious even skimming fast. Green for the
// affirming bucket, blue for the growth bucket — not the "never red" score
// rule, just a semantic color pairing for two section banners.
function BucketTitle({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "good" | "grow";
}) {
  return (
    <p
      className={`mt-6 rounded-xl px-4 py-2.5 text-center text-[17px] font-bold ${
        tone === "good"
          ? "bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-400"
          : "bg-primary/10 text-primary dark:bg-primary/20 dark:text-secondary"
      }`}
    >
      {children}
    </p>
  );
}

export default function ResultsReportScreen({
  phase,
  email,
  declined = false,
  answers,
}: {
  phase: Phase;
  email: string;
  declined?: boolean;
  answers?: (number | null)[];
}) {
  const [status, setStatus] = useState<"loading" | "error" | "ready">(
    declined ? "ready" : "loading",
  );
  const [fetchedSubmissions, setFetchedSubmissions] = useState<Submission[]>([]);

  // Declined (Section 6): no row was ever written, so there is nothing to
  // look up. Score directly from the in-memory answers already on hand —
  // this always renders as a single, baseline-only submission, which
  // naturally suppresses comparison/journey below (same code path a genuine
  // first-timer takes). Derived with useMemo, not effect+setState, since
  // it's a pure function of props already in hand.
  const declinedSubmissions = useMemo<Submission[]>(
    () => [
      {
        createdAt: new Date().toISOString(),
        phase,
        items: (answers ?? []).filter((v): v is number => v !== null),
      },
    ],
    [phase, answers],
  );

  useEffect(() => {
    if (declined) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course: "ryl", email }),
        });
        if (!res.ok) throw new Error("lookup failed");
        const body = await res.json();
        if (!cancelled) {
          setFetchedSubmissions(body.submissions ?? []);
          setStatus("ready");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email, declined]);

  const submissions = declined ? declinedSubmissions : fetchedSubmissions;

  if (status === "loading") {
    return (
      <ScreenContainer>
        <p className="text-[15px] text-muted">Building your results…</p>
      </ScreenContainer>
    );
  }

  if (status === "error" || submissions.length === 0) {
    return (
      <ScreenContainer>
        <h1 className="text-[26px] font-semibold tracking-tight text-ink">
          Your response was recorded.
        </h1>
        <p className="mt-2 text-[15px] text-muted">
          We couldn&apos;t load your results right now, but your answers are saved safely.
        </p>
      </ScreenContainer>
    );
  }

  const current = submissions[submissions.length - 1];
  const baseline = submissions[0];
  const hasBaseline = submissions.length > 1;

  const currentSummary = summarizeScore(current.items);
  const baselineSummary = hasBaseline ? summarizeScore(baseline.items) : null;
  const deltas = baselineSummary ? buildDeltas(currentSummary, baselineSummary) : null;
  const currentRanks = rankDomains(currentSummary.domains);

  // Week-10 "Finish my Journey": with all three submissions in hand (first,
  // retake, week10), show the real middle checkpoint everywhere instead of
  // only ever comparing current-vs-first and silently dropping it.
  const showJourney = phase === "week10" && submissions.length >= 3;
  // Most recent checkpoint before "now", not the earliest-ever retake — so
  // someone who retook 3+ times before finally hitting week10 still sees
  // their latest data point as "Second," not their very first retake.
  // Identical to submissions[1] in the normal 3-submission case, so this
  // changes nothing for the common path.
  const midSubmission = showJourney ? submissions[submissions.length - 2] : null;
  const midSummary = midSubmission ? summarizeScore(midSubmission.items) : null;
  const journeySummaryText =
    showJourney && midSubmission
      ? buildJourneySummary([
          { summary: baselineSummary!, dateLabel: formatDate(baseline.createdAt) },
          { summary: midSummary!, dateLabel: formatDate(midSubmission.createdAt) },
          { summary: currentSummary, dateLabel: formatDate(current.createdAt) },
        ])
      : null;
  // Jeff review call, 2026-08-11: "Break results into two clearly labeled
  // buckets" — top 5 of 9 by rank read as "does well", the rest as growth
  // areas. Rank-based (not a fixed score threshold) so both buckets are
  // always populated regardless of how high or low the whole map runs.
  const doesWellDomains = currentSummary.domains.filter((d) => currentRanks[d.domain] <= 5);
  const growthDomains = currentSummary.domains.filter((d) => currentRanks[d.domain] > 5);
  const domainIndexByCode: Record<string, number> = {};
  currentSummary.domains.forEach((d, i) => {
    domainIndexByCode[d.domain] = i;
  });
  const journeyPoints: JourneyPoint[] =
    submissions.length > 2
      ? submissions.map((s, i) => ({
          label: i === 0 ? "Start" : i === submissions.length - 1 ? "Latest" : `Check-in ${i}`,
          date: s.createdAt,
          aiIndexPercent: summarizeScore(s.items).aiIndexPercent,
        }))
      : [];

  const showWeek10Shape = hasBaseline && phase === "week10";
  const shapeTitle = showWeek10Shape ? SHAPE_TITLE_WEEK10 : SHAPE_TITLE_DEFAULT;
  const elapsedText = hasBaseline ? formatElapsed(baseline.createdAt, current.createdAt) : null;
  // Jeff review call, 2026-08-11: state the last-test date and elapsed time
  // explicitly, not folded into a parenthetical.
  const subheadLine = !hasBaseline
    ? null
    : showWeek10Shape
      ? `${WEEK10_SUBHEAD} (${elapsedText})`
      : `Last time you took the test was ${formatDate(baseline.createdAt)} — that's ${elapsedText}.`;
  const headlineSentence = selectHeadline(currentSummary.domains);

  const sigLabels = currentSummary.signature.map((d) => d.label);
  const tfLabels = currentSummary.trainingFocus.map((d) => d.label);
  const sigTitle = cardTitle("Signature Strength", currentSummary.signature.length);
  const tfTitle = cardTitle("Training Focus", currentSummary.trainingFocus.length);

  const dayZeroIso = hasBaseline ? baseline.createdAt : current.createdAt;
  const weekTenDateText = formatDate(
    new Date(new Date(dayZeroIso).getTime() + 70 * 24 * 60 * 60 * 1000).toISOString(),
  );
  // Someone who picked "Finish My Journey" as their literal first action
  // (no real baseline) should see the same forward-looking "next check-in"
  // line a genuine first-timer sees, not have it silently suppressed just
  // because the phase label says "week10" — there's no journey to finish
  // yet in that case, functionally the same situation as a first-timer.
  const showWeekTenLine = phase !== "week10" || !hasBaseline;

  const aiDeltaFull = baselineSummary
    ? computeDelta(currentSummary.aiIndexPercent, baselineSummary.aiIndexPercent)
    : null;
  const qaiDeltaFull = baselineSummary
    ? computeDelta(currentSummary.qaiPercent, baselineSummary.qaiPercent)
    : null;

  return (
    <ScreenContainer center={false}>
      <div className="w-full">
        {/* 1. Opening frame — headline first, then the "Taken on" date as an
            actual subtitle right under it (was buried as a tiny caption
            after two paragraphs of body text), then the rest of the body. */}
        <p className="text-center text-[26px] leading-snug font-semibold tracking-tight text-ink">
          {OPENING_FRAME_LINES[0]}
        </p>
        <p className="mt-1.5 text-center text-[16px] font-semibold text-primary">
          Taken on {formatDate(current.createdAt)}
        </p>
        {OPENING_FRAME_LINES.slice(1).map((line, i) => (
          <p key={i} className="mt-2 text-center text-[16px] leading-relaxed text-muted">
            {line}
          </p>
        ))}

        {/* Jeff review calls, 2026-08-10 & 2026-08-11: education-only
            disclosure, now red/boxed so it isn't missed. */}
        <div className="mt-4">
          <RedNotice>{RESULTS_DISCLOSURE}</RedNotice>
        </div>

        {/* 2. Headline read — "YOUR SHAPE" */}
        <p className="mt-8 text-center text-[13px] font-semibold tracking-wide text-muted uppercase">
          {shapeTitle}
        </p>
        {subheadLine && <p className="mt-1 text-center text-[15px] text-muted">{subheadLine}</p>}
        <p className="mt-3 text-center text-[24px] leading-relaxed text-ink">{headlineSentence}</p>
        {journeySummaryText && (
          <p className="mt-3 text-center text-[15px] leading-relaxed text-ink/85">
            <FormattedText text={journeySummaryText} />
          </p>
        )}

        {/* 3. Signature Strength / Training Focus cards */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="glass rounded-2xl px-3 py-3 text-center">
            <p className="text-[13px] font-medium tracking-wide text-muted uppercase">
              {sigTitle}
            </p>
            <TieList labels={sigLabels} />
          </div>
          <div className="glass rounded-2xl px-3 py-3 text-center">
            <p className="text-[13px] font-medium tracking-wide text-muted uppercase">
              {tfTitle}
            </p>
            <TieList labels={tfLabels} />
          </div>
        </div>

        {/* 4/5. THE NINE TRAINABLE AREAS, bucketed — Jeff review call,
            2026-08-11: two clearly labeled buckets instead of one flat
            list, framed constructively (never a flat "weakness"). Big "9"
            as a stat-style visual anchor for this section specifically —
            not a change to SectionTitle itself, which other captions
            ("AI Orchestration", "Where You Stand") still use as-is. An
            actual <h2> (was a plain div) so it reads as a real header
            ahead of the description paragraph, not just a styled label. */}
        <h2 className="mt-10 flex items-center justify-center gap-3" aria-label={THE_NINE_TITLE}>
          <span aria-hidden className="text-[68px] leading-none font-bold text-primary">
            9
          </span>
          <span
            aria-hidden
            className="text-left text-[20px] leading-tight font-semibold tracking-wide text-muted uppercase"
          >
            Trainable
            <br />
            Areas
          </span>
        </h2>
        <p className="mt-4 text-[14px] leading-relaxed text-muted">
          <FormattedText text={SCORE_SCALE_EXPLANATION} />
        </p>

        <BucketTitle tone="good">{DOES_WELL_BUCKET_TITLE}</BucketTitle>
        <div className="mt-2 flex flex-col divide-y divide-border">
          {doesWellDomains.map((d) => {
            const i = domainIndexByCode[d.domain];
            return (
              <DomainBarRow
                key={d.domain}
                label={d.label}
                percent={d.percent}
                delta={deltas ? deltas[i].pointsChange : undefined}
                comparison={
                  baselineSummary
                    ? {
                        prevPercent: baselineSummary.domains[i].percent,
                        prevDate: baseline.createdAt,
                        midPercent: midSummary ? midSummary.domains[i].percent : undefined,
                        midDate: midSubmission ? midSubmission.createdAt : undefined,
                        currentDate: current.createdAt,
                      }
                    : undefined
                }
                interpretation={SIGNATURE_STRENGTH_COPY[d.domain]}
              />
            );
          })}
        </div>

        <BucketTitle tone="grow">{GROWTH_BUCKET_TITLE}</BucketTitle>
        <div className="mt-2 flex flex-col divide-y divide-border">
          {growthDomains.map((d) => {
            const i = domainIndexByCode[d.domain];
            return (
              <DomainBarRow
                key={d.domain}
                label={d.label}
                percent={d.percent}
                delta={deltas ? deltas[i].pointsChange : undefined}
                comparison={
                  baselineSummary
                    ? {
                        prevPercent: baselineSummary.domains[i].percent,
                        prevDate: baseline.createdAt,
                        midPercent: midSummary ? midSummary.domains[i].percent : undefined,
                        midDate: midSubmission ? midSubmission.createdAt : undefined,
                        currentDate: current.createdAt,
                      }
                    : undefined
                }
                interpretation={TRAINING_FOCUS_COPY[d.domain]}
              />
            );
          })}
        </div>

        {/* 6. AI Orchestration */}
        <SectionTitle>AI Orchestration</SectionTitle>
        <div className="mt-2 flex flex-col divide-y divide-border">
          <DomainBarRow
            label="AI Orchestration"
            percent={currentSummary.aiIndexPercent}
            delta={aiDeltaFull?.pointsChange}
            comparison={
              baselineSummary
                ? {
                    prevPercent: baselineSummary.aiIndexPercent,
                    prevDate: baseline.createdAt,
                    midPercent: midSummary ? midSummary.aiIndexPercent : undefined,
                    midDate: midSubmission ? midSubmission.createdAt : undefined,
                    currentDate: current.createdAt,
                  }
                : undefined
            }
            interpretation={AI_ORCHESTRATION_INTERPRETATION}
          />
          <DomainBarRow
            label="AI-Delegation"
            sublabel={QAI_SUBLABEL}
            percent={currentSummary.qaiPercent}
            delta={qaiDeltaFull?.pointsChange}
            comparison={
              baselineSummary
                ? {
                    prevPercent: baselineSummary.qaiPercent,
                    prevDate: baseline.createdAt,
                    midPercent: midSummary ? midSummary.qaiPercent : undefined,
                    midDate: midSubmission ? midSubmission.createdAt : undefined,
                    currentDate: current.createdAt,
                  }
                : undefined
            }
            interpretation={QAI_INTERPRETATION}
          />
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">{AI_ORCHESTRATION_CAPTION}</p>

        {/* 7. Where you stand */}
        <SectionTitle>Where You Stand</SectionTitle>
        <div className="mt-2 flex flex-col gap-2">
          {currentSummary.anchors.map((a) => {
            const prevAnchor = baselineSummary?.anchors.find((x) => x.id === a.id);
            const midAnchor = midSummary?.anchors.find((x) => x.id === a.id);
            const delta = prevAnchor ? computeDelta(a.raw, prevAnchor.raw) : null;
            return (
              <AnchorRow
                key={a.id}
                label={ANCHOR_LABELS[a.id]}
                raw={a.raw}
                delta={delta?.pointsChange}
                comparison={
                  prevAnchor
                    ? {
                        prevRaw: prevAnchor.raw,
                        prevDate: baseline.createdAt,
                        midRaw: midAnchor ? midAnchor.raw : undefined,
                        midDate: midSubmission ? midSubmission.createdAt : undefined,
                        currentDate: current.createdAt,
                      }
                    : undefined
                }
                interpretation={ANCHOR_INTERPRETATIONS[a.id]}
              />
            );
          })}
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">{ANCHOR_CAPTION}</p>

        {/* 8. Continuity box — the "come back any time" messaging, declined
            sessions skip this entirely since there's nothing to come back
            to. */}
        {!declined && (
          <div className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3.5">
            <p className="text-[15px] font-semibold text-primary">{CONTINUITY_HEADLINE}</p>
            <p className="mt-1 text-[14px] leading-relaxed text-ink/80">
              <FormattedText text={CONTINUITY_BODY} />
            </p>
            {showWeekTenLine && (
              <p className="mt-1 text-[14px] leading-relaxed text-ink/80">
                {CONTINUITY_WEEK10_PREFIX}
                {weekTenDateText}
              </p>
            )}
            <p className="mt-1 text-[14px] leading-relaxed text-ink/80">{CONTINUITY_CLOSING}</p>
          </div>
        )}

        {/* 8b. Download-now caution — own red box directly above the PDF
            button, same red treatment the PDF itself uses for this warning,
            so it isn't missed the way a small line inside the blue box was. */}
        <div className={declined ? "mt-8" : "mt-4"}>
          <RedNotice>{declined ? DECLINED_SAVE_NOW_WARNING : SAVE_YOUR_COPY_NOTE}</RedNotice>
        </div>

        {/* 9. PDF button */}
        <button
          type="button"
          onClick={() =>
            generateReportPdf({
              email,
              phase,
              declined,
              current: currentSummary,
              currentDate: current.createdAt,
              baseline: baselineSummary
                ? { summary: baselineSummary, date: baseline.createdAt }
                : undefined,
              mid:
                midSummary && midSubmission
                  ? { summary: midSummary, date: midSubmission.createdAt }
                  : undefined,
              journey: journeyPoints.length > 0 ? journeyPoints : undefined,
              unmatchedRetake: current.unmatchedRetake,
            })
          }
          className="tap mt-4 w-full rounded-full bg-primary px-6 py-4 text-[17px] font-medium text-white shadow-[0_1px_2px_rgb(0_0_0/0.1),0_8px_20px_rgb(0_0_0/0.15)]"
        >
          Download a copy (PDF)
        </button>

        {/* 10. Closing line */}
        <p className="mt-6 text-center text-[16px] leading-relaxed text-muted italic">
          {CLOSING_LINE}
        </p>

        {current.unmatchedRetake && (
          <p className="mt-3 text-center text-[14px] leading-relaxed text-muted">
            {UNMATCHED_RETAKE_NOTE}
          </p>
        )}
        {declined && (
          <p className="mt-3 text-center text-[14px] leading-relaxed text-muted">
            {DECLINE_RESULTS_NOTE}
          </p>
        )}
      </div>
    </ScreenContainer>
  );
}
