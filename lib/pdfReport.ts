// Client-side PDF generation for the "download your report" action. Runs
// entirely in the browser — nothing is sent to or generated on a server, so
// the "we don't store this report, grab it now" copy on the results screen
// stays literally true. Uses jsPDF, the only new dependency this required.
//
// Structure follows the 16Personalities-factsheet shape Jeff referenced on
// the 2026-08-11 call (cover → per-area breakdown → overall summary) —
// adapted to our 9 trainable areas, not their content or wording.
//
// Full parity pass (2026-08-25): the PDF previously left out real content
// the results screen shows — the personalized "shape" narrative, the two
// bucketed sections ("Areas You Do Well" / "Areas You Could Grow"), and
// the continuity/closing messaging — and it printed BOTH the strength and
// growth copy for every single domain regardless of which bucket that
// domain was actually in on screen. This rewrite mirrors the screen's
// actual content and structure section-for-section, and bumps font sizes
// throughout since this is a document people keep and read later, not a
// glance-and-close notification.

import jsPDF from "jspdf";
import { ScoreSummary } from "./scoring";
import { Phase, DECLINE_RESULTS_NOTE } from "./questions";
import {
  OPENING_FRAME_LINES,
  UNMATCHED_RETAKE_NOTE,
  SHAPE_TITLE_DEFAULT,
  SHAPE_TITLE_WEEK10,
  WEEK10_SUBHEAD,
  selectHeadline,
  ANCHOR_LABELS,
  ANCHOR_CAPTION,
  ANCHOR_INTERPRETATIONS,
  AI_ORCHESTRATION_CAPTION,
  AI_ORCHESTRATION_INTERPRETATION,
  QAI_INTERPRETATION,
  QAI_SUBLABEL,
  THE_NINE_TITLE,
  DOES_WELL_BUCKET_TITLE,
  GROWTH_BUCKET_TITLE,
  SCORE_SCALE_EXPLANATION,
  CONTINUITY_HEADLINE,
  CONTINUITY_BODY,
  CONTINUITY_WEEK10_PREFIX,
  CONTINUITY_CLOSING,
  CLOSING_LINE,
  formatTieList,
  RESULTS_DISCLOSURE,
  SIGNATURE_STRENGTH_COPY,
  TRAINING_FOCUS_COPY,
  PDF_NO_EMAIL_WARNING_DECLINED,
  PDF_NO_EMAIL_WARNING_SAVED,
  PDF_EDUCATION_LABEL,
  PDF_INTRO_FRAMING,
  rankDomains,
  formatElapsed,
  buildJourneySummary,
} from "./resultsCopy";

type RGB = [number, number, number];

const COLOR = {
  primary: [37, 99, 235] as RGB, // Deep Blue
  ink: [30, 41, 59] as RGB, // Dark Slate
  muted: [100, 116, 139] as RGB, // Gray
  green: [21, 128, 61] as RGB,
  // Light, print-friendly tints for the two bucket banners — same green/blue
  // pairing as the on-screen BucketTitle, just a paper-appropriate tint
  // instead of a solid fill.
  greenBg: [220, 252, 231] as RGB,
  greenBorder: [134, 239, 172] as RGB,
  blueBg: [219, 234, 254] as RGB,
  blueBorder: [147, 197, 253] as RGB,
  // Never red for scores/deltas — a decline renders the same neutral grey
  // as "no change" (matches the on-screen rule). Red is reserved entirely
  // for the disclosure/warning notices below, same as on-screen RedNotice.
  red: [185, 28, 28] as RGB,
  redBg: [254, 226, 226] as RGB,
  redBorder: [252, 165, 165] as RGB,
  line: [226, 232, 240] as RGB, // Light Gray border
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export interface JourneyPoint {
  label: string;
  date: string;
  aiIndexPercent: number;
}

export interface ReportPdfParams {
  email: string;
  phase: Phase;
  // Which warning is true depends on this: a decline writes zero rows
  // anywhere, but a normal (consented) submission's answers ARE saved —
  // that's what makes retakes work. Picking the wrong one here would be a
  // false claim about what actually happens on the backend.
  declined: boolean;
  currentDate: string;
  current: ScoreSummary;
  baseline?: { summary: ScoreSummary; date: string };
  // The real middle checkpoint (the retake) on the week-10 "Finish my
  // Journey" report — only present when there are three submissions.
  // Without this the report only ever compared current-vs-first.
  mid?: { summary: ScoreSummary; date: string };
  journey?: JourneyPoint[];
  // Same unmatched-retake case the screen surfaces a note for — kept out of
  // the PDF before this pass, which made the saved record incomplete
  // relative to what the person actually saw on screen.
  unmatchedRetake?: boolean;
}

export function generateReportPdf(params: ReportPdfParams): void {
  const {
    email,
    phase,
    declined,
    currentDate,
    current,
    baseline,
    mid,
    journey,
    unmatchedRetake,
  } = params;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 20;
  const contentWidth = pageWidth - marginX * 2;
  let y = 22;

  // Small red "EDUCATION ONLY" stamp, top-right of every page — Jeff
  // review call, 2026-08-11: "every section retains the red Education
  // only disclosure." A full sentence repeated on every one of 9+ pages
  // would be noise; a compact, unmissable stamp on every page satisfies
  // the same intent.
  function drawEducationStamp() {
    const stampW = 42;
    const stampH = 7;
    const x = pageWidth - marginX - stampW;
    const stampY = 10;
    doc.setDrawColor(...COLOR.redBorder);
    doc.setFillColor(...COLOR.redBg);
    doc.roundedRect(x, stampY, stampW, stampH, 1.5, 1.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...COLOR.red);
    doc.text(PDF_EDUCATION_LABEL, x + stampW / 2, stampY + 4.7, { align: "center" });
  }

  function ensureSpace(needed: number) {
    if (y + needed > pageHeight - 22) {
      doc.addPage();
      y = 22;
      drawEducationStamp();
    }
  }

  // Screen copy uses **bold** markers (see components/FormattedText.tsx) for
  // on-screen emphasis — jsPDF has no markdown support, so strip them here
  // rather than printing literal asterisks in the PDF.
  function stripBold(text: string): string {
    return text.replace(/\*\*/g, "");
  }

  // Generic flowing paragraph — every plain-text block below (framing
  // lines, captions, continuity copy, the shape narrative) goes through
  // this so line-height/page-break math lives in exactly one place.
  function flowText(
    rawText: string,
    opts: { size?: number; color?: RGB; style?: "normal" | "bold" | "italic"; lineH?: number; gap?: number } = {},
  ) {
    const size = opts.size ?? 10;
    const color = opts.color ?? COLOR.ink;
    const style = opts.style ?? "normal";
    const lineH = opts.lineH ?? size * 0.42;
    const gap = opts.gap ?? 4;
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(stripBold(rawText), contentWidth);
    ensureSpace(lines.length * lineH + gap);
    doc.setTextColor(...color);
    doc.text(lines, marginX, y);
    y += lines.length * lineH + gap;
  }

  // Short interpretation paragraph under a row (anchors, AI rows, bucketed
  // domains) — same dynamic-line-height pattern as flowText, sized for
  // reading comfort since this is the substantive per-area content.
  function paragraph(rawText: string) {
    const text = stripBold(rawText);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(text, contentWidth);
    const lineH = 4.4;
    ensureSpace(lines.length * lineH + 4);
    doc.setTextColor(...COLOR.ink);
    doc.text(lines, marginX, y);
    y += lines.length * lineH + 4;
  }

  // Compact "First X -> Second Y -> Now Z" trail — only drawn when a real
  // middle checkpoint exists, so the report shows all three submissions
  // instead of just first-vs-current.
  function trailLine(text: string) {
    ensureSpace(5.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.muted);
    doc.text(text, marginX, y);
    y += 5;
  }

  function hr() {
    doc.setDrawColor(...COLOR.line);
    doc.setLineWidth(0.3);
    doc.line(marginX, y, pageWidth - marginX, y);
  }

  function redBox(text: string) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    const lines = doc.splitTextToSize(text, contentWidth - 8);
    const lineH = 4.6;
    const boxH = lines.length * lineH + 6;
    ensureSpace(boxH + 4);
    doc.setDrawColor(...COLOR.redBorder);
    doc.setFillColor(...COLOR.redBg);
    doc.roundedRect(marginX, y, contentWidth, boxH, 2, 2, "FD");
    doc.setTextColor(...COLOR.red);
    doc.text(lines, marginX + 4, y + 5.8);
    y += boxH + 5;
  }

  // Bucket banner — same green/blue pairing as the on-screen BucketTitle,
  // a light print-friendly tint instead of a solid fill.
  function bucketBanner(title: string, tone: "good" | "grow") {
    const bg = tone === "good" ? COLOR.greenBg : COLOR.blueBg;
    const border = tone === "good" ? COLOR.greenBorder : COLOR.blueBorder;
    const textColor = tone === "good" ? COLOR.green : COLOR.primary;
    const boxH = 11;
    ensureSpace(boxH + 8);
    doc.setDrawColor(...border);
    doc.setFillColor(...bg);
    doc.roundedRect(marginX, y, contentWidth, boxH, 2.5, 2.5, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...textColor);
    doc.text(title, pageWidth / 2, y + boxH / 2 + 1.6, { align: "center" });
    y += boxH + 7;
  }

  function sectionHeader(title: string) {
    ensureSpace(11);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(...COLOR.muted);
    doc.text(title.toUpperCase(), marginX, y);
    y += 6.5;
  }

  // --- Cover ---
  drawEducationStamp();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...COLOR.primary);
  doc.text("REWRITE YOUR LIFE", marginX, y);
  y += 8;

  const title = !baseline
    ? "Your Assessment"
    : phase === "week10"
      ? "Your Journey — Complete"
      : "Your Journey — Updated";

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...COLOR.ink);
  doc.text(title, marginX, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(...COLOR.muted);
  doc.text(`${formatDate(currentDate)}  ·  ${email}`, marginX, y);
  y += 6;

  if (baseline) {
    doc.text(`Since your first check-in on ${formatDate(baseline.date)}`, marginX, y);
    y += 6;
  }

  y += 2;
  flowText(PDF_INTRO_FRAMING, { size: 10, color: COLOR.ink, lineH: 4.4, gap: 4 });

  // Opening narrative — same three lines as the top of the results screen,
  // previously absent from the PDF entirely.
  flowText(OPENING_FRAME_LINES[0], { size: 12, style: "bold", color: COLOR.ink, lineH: 5, gap: 3 });
  OPENING_FRAME_LINES.slice(1).forEach((line) => {
    flowText(line, { size: 10, color: COLOR.muted, lineH: 4.4, gap: 3 });
  });
  y += 2;

  redBox(RESULTS_DISCLOSURE);
  redBox(declined ? PDF_NO_EMAIL_WARNING_DECLINED : PDF_NO_EMAIL_WARNING_SAVED);

  hr();
  y += 8;

  // --- Your Shape — the personalized headline read, previously missing
  // from the PDF entirely even though it's the single most personal
  // sentence on the results screen. ---
  const showWeek10Shape = !!baseline && phase === "week10";
  const shapeTitleText = showWeek10Shape ? SHAPE_TITLE_WEEK10 : SHAPE_TITLE_DEFAULT;
  const elapsedTextPdf = baseline ? formatElapsed(baseline.date, currentDate) : null;
  const subheadLinePdf = !baseline
    ? null
    : showWeek10Shape
      ? `${WEEK10_SUBHEAD} (${elapsedTextPdf})`
      : `Last time you took the test was ${formatDate(baseline.date)} — that's ${elapsedTextPdf}.`;
  const headlineSentencePdf = selectHeadline(current.domains);

  sectionHeader(shapeTitleText);
  if (subheadLinePdf) {
    flowText(subheadLinePdf, { size: 9.5, color: COLOR.muted, lineH: 4.2, gap: 2 });
  }
  flowText(headlineSentencePdf, { size: 12.5, style: "bold", color: COLOR.ink, lineH: 5.4, gap: 5 });

  // The 3-point journey narrative (week-10, with a real middle checkpoint)
  // sits right under the shape read here — same position as on screen.
  const journeyNarrativePdf =
    baseline && mid
      ? buildJourneySummary([
          { summary: baseline.summary, dateLabel: formatDate(baseline.date) },
          { summary: mid.summary, dateLabel: formatDate(mid.date) },
          { summary: current, dateLabel: formatDate(currentDate) },
        ])
      : null;
  if (journeyNarrativePdf) {
    flowText(journeyNarrativePdf, { size: 10, color: COLOR.ink, lineH: 4.4, gap: 6 });
  }

  y += 2;

  // --- Signature strength / training focus ---
  // Box height is computed from the ACTUAL wrapped line count of whichever
  // side has more tied domains, not a fixed constant — a fixed 18mm box
  // let a long tie list (several domains tied at the max/min) run past the
  // box border when it wrapped to 2+ lines. Same dynamic-height pattern as
  // redBox/flowText above. Both boxes share one height so they still line
  // up side by side.
  if (current.signature.length > 0 || current.trainingFocus.length > 0) {
    const boxW = (contentWidth - 6) / 2;
    const calloutLineH = 5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    const sigValue =
      current.signature.length > 0 ? formatTieList(current.signature.map((d) => d.label)) : "";
    const tfValue =
      current.trainingFocus.length > 0
        ? formatTieList(current.trainingFocus.map((d) => d.label))
        : "";
    const sigLines = sigValue ? doc.splitTextToSize(sigValue, boxW - 8) : [];
    const tfLines = tfValue ? doc.splitTextToSize(tfValue, boxW - 8) : [];
    const neededLines = Math.max(sigLines.length, tfLines.length, 1);
    const boxH = 15 + (neededLines - 1) * calloutLineH + 4;

    ensureSpace(boxH + 10);

    const drawCallout = (x: number, label: string, lines: string[]) => {
      doc.setDrawColor(...COLOR.line);
      doc.roundedRect(x, y, boxW, boxH, 3, 3);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...COLOR.muted);
      doc.text(label, x + 4, y + 7.5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12.5);
      doc.setTextColor(...COLOR.ink);
      doc.text(lines, x + 4, y + 15);
    };

    if (current.signature.length > 0) {
      drawCallout(marginX, "SIGNATURE STRENGTH", sigLines);
    }
    if (current.trainingFocus.length > 0) {
      drawCallout(marginX + boxW + 6, "TRAINING FOCUS", tfLines);
    }
    y += boxH + 10;
  }

  // --- The Nine Trainable Areas, bucketed exactly like the screen ---
  sectionHeader(THE_NINE_TITLE);
  flowText(SCORE_SCALE_EXPLANATION, { size: 9.5, color: COLOR.muted, lineH: 4.2, gap: 6 });

  const ranks = rankDomains(current.domains);
  const domainIndexByCode: Record<string, number> = {};
  current.domains.forEach((d, i) => {
    domainIndexByCode[d.domain] = i;
  });
  const doesWellDomains = current.domains.filter((d) => ranks[d.domain] <= 5);
  const growthDomains = current.domains.filter((d) => ranks[d.domain] > 5);

  function renderDomainBlock(
    d: (typeof current.domains)[number],
    label: string,
    labelColor: RGB,
    copy: string,
  ) {
    const i = domainIndexByCode[d.domain];
    const delta = baseline ? d.percent - baseline.summary.domains[i].percent : undefined;
    ensureSpace(30);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...COLOR.ink);
    doc.text(d.label, marginX, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    const scoreText = `${d.percent}%`;
    const scoreWidth = doc.getTextWidth(scoreText);
    doc.text(scoreText, pageWidth - marginX - scoreWidth, y);

    if (delta !== undefined) {
      doc.setFontSize(9.5);
      const color = delta > 0 ? COLOR.green : COLOR.muted;
      doc.setTextColor(...color);
      const deltaText = delta === 0 ? "no change" : `${delta > 0 ? "+" : ""}${delta}%`;
      const deltaWidth = doc.getTextWidth(deltaText);
      doc.text(deltaText, pageWidth - marginX - scoreWidth - 4 - deltaWidth, y);
    }
    y += 5.5;

    if (baseline && mid) {
      trailLine(
        `First ${baseline.summary.domains[i].percent}%  ·  Second ${mid.summary.domains[i].percent}%  ·  Now ${d.percent}%`,
      );
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...labelColor);
    doc.text(label, marginX, y);
    y += 4.5;
    paragraph(copy);

    doc.setDrawColor(...COLOR.line);
    doc.setLineWidth(0.15);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 6;
  }

  bucketBanner(DOES_WELL_BUCKET_TITLE, "good");
  doesWellDomains.forEach((d) => {
    renderDomainBlock(d, "WHY THIS IS A STRENGTH", COLOR.green, SIGNATURE_STRENGTH_COPY[d.domain]);
  });

  bucketBanner(GROWTH_BUCKET_TITLE, "grow");
  growthDomains.forEach((d) => {
    renderDomainBlock(d, "FIRST MOVE", COLOR.primary, TRAINING_FOCUS_COPY[d.domain]);
  });

  // --- Life anchors --- (X out of 10, never a percentage)
  sectionHeader("Where You Stand");
  current.anchors.forEach((a) => {
    ensureSpace(10);
    const rowBaseline = y;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11.5);
    doc.setTextColor(...COLOR.ink);
    doc.text(ANCHOR_LABELS[a.id] ?? "", marginX, rowBaseline, { maxWidth: contentWidth - 40 });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...COLOR.ink);
    const valueText = `${a.raw} out of 10`;
    const valueWidth = doc.getTextWidth(valueText);
    doc.text(valueText, pageWidth - marginX - valueWidth, rowBaseline);
    y = rowBaseline + 6.5;
    if (baseline && mid) {
      const prevAnchor = baseline.summary.anchors.find((x) => x.id === a.id);
      const midAnchor = mid.summary.anchors.find((x) => x.id === a.id);
      if (prevAnchor && midAnchor) {
        trailLine(`First ${prevAnchor.raw}  ·  Second ${midAnchor.raw}  ·  Now ${a.raw}`);
      }
    }
    if (ANCHOR_INTERPRETATIONS[a.id]) paragraph(ANCHOR_INTERPRETATIONS[a.id]);
    const dividerY = y - 1;
    doc.setDrawColor(...COLOR.line);
    doc.setLineWidth(0.15);
    doc.line(marginX, dividerY, pageWidth - marginX, dividerY);
    y += 4;
  });
  flowText(ANCHOR_CAPTION, { size: 9.5, style: "italic", color: COLOR.muted, lineH: 4.2, gap: 6 });

  // --- AI index ---
  function aiRow(
    label: string,
    percent: number,
    delta?: number,
    interpretation?: string,
    trail?: { first: number; second: number },
    sublabel?: string,
  ) {
    ensureSpace(10);
    const rowBaseline = y;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11.5);
    doc.setTextColor(...COLOR.ink);
    doc.text(label, marginX, rowBaseline, { maxWidth: contentWidth - 40 });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...COLOR.ink);
    const percentText = `${percent}%`;
    const percentWidth = doc.getTextWidth(percentText);
    doc.text(percentText, pageWidth - marginX - percentWidth, rowBaseline);
    if (delta !== undefined) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      const color = delta > 0 ? COLOR.green : COLOR.muted;
      doc.setTextColor(...color);
      const deltaText = delta === 0 ? "no change" : `${delta > 0 ? "+" : ""}${delta}%`;
      const deltaWidth = doc.getTextWidth(deltaText);
      doc.text(deltaText, pageWidth - marginX - percentWidth - 5 - deltaWidth, rowBaseline);
    }
    y = rowBaseline + 6.5;
    if (sublabel) trailLine(sublabel);
    if (trail) {
      trailLine(`First ${trail.first}%  ·  Second ${trail.second}%  ·  Now ${percent}%`);
    }
    if (interpretation) paragraph(interpretation);
    const dividerY = y - 1;
    doc.setDrawColor(...COLOR.line);
    doc.setLineWidth(0.15);
    doc.line(marginX, dividerY, pageWidth - marginX, dividerY);
    y += 4;
  }

  sectionHeader("AI Orchestration");
  const aiDelta = baseline ? current.aiIndexPercent - baseline.summary.aiIndexPercent : undefined;
  aiRow(
    "AI Orchestration",
    current.aiIndexPercent,
    aiDelta,
    AI_ORCHESTRATION_INTERPRETATION,
    baseline && mid
      ? { first: baseline.summary.aiIndexPercent, second: mid.summary.aiIndexPercent }
      : undefined,
  );
  const qaiDelta = baseline ? current.qaiPercent - baseline.summary.qaiPercent : undefined;
  aiRow(
    "AI-Delegation",
    current.qaiPercent,
    qaiDelta,
    QAI_INTERPRETATION,
    baseline && mid ? { first: baseline.summary.qaiPercent, second: mid.summary.qaiPercent } : undefined,
    QAI_SUBLABEL,
  );
  flowText(AI_ORCHESTRATION_CAPTION, { size: 9.5, style: "italic", color: COLOR.muted, lineH: 4.2, gap: 6 });

  // --- Overall summary --- factual, not a new evidentiary claim: just
  // restates the same rank split shown on-screen, in one plain sentence.
  sectionHeader("Overall Summary");
  const doesWellLabels = doesWellDomains.map((d) => d.label);
  const growthLabels = growthDomains.map((d) => d.label);
  const summaryText = `Across your nine areas, you're showing up strongest in ${formatTieList(doesWellLabels)}. The areas with the most room to grow right now are ${formatTieList(growthLabels)}.`;
  flowText(summaryText, { size: 10, color: COLOR.ink, lineH: 4.6, gap: 6 });

  // --- Journey checkpoint list --- (PDF-only extra detail beyond the
  // screen — every check-in's date and AI-index snapshot, in one place.)
  if (journey && journey.length > 0) {
    sectionHeader("Your Journey");
    journey.forEach((point) => {
      ensureSpace(7.5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...COLOR.muted);
      doc.text(`${point.label} · ${formatDate(point.date)}`, marginX, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLOR.ink);
      const text = `AI ${point.aiIndexPercent}%`;
      doc.text(text, pageWidth - marginX - doc.getTextWidth(text), y);
      y += 6.5;
    });
    y += 4;
  }

  // --- Continuity — the same "your map is saved, come back any time"
  // messaging as the screen's blue box. Skipped for declined sessions,
  // same as on screen — there's nothing to come back to. ---
  if (!declined) {
    ensureSpace(12);
    hr();
    y += 7;
    flowText(CONTINUITY_HEADLINE, { size: 12, style: "bold", color: COLOR.primary, lineH: 5, gap: 3 });
    flowText(CONTINUITY_BODY, { size: 10, color: COLOR.ink, lineH: 4.4, gap: 2 });
    const showWeekTenLine = phase !== "week10" || !baseline;
    if (showWeekTenLine) {
      const dayZeroIso = baseline ? baseline.date : currentDate;
      const weekTenDateText = formatDate(
        new Date(new Date(dayZeroIso).getTime() + 70 * 24 * 60 * 60 * 1000).toISOString(),
      );
      flowText(`${CONTINUITY_WEEK10_PREFIX}${weekTenDateText}`, {
        size: 10,
        color: COLOR.ink,
        lineH: 4.4,
        gap: 2,
      });
    }
    flowText(CONTINUITY_CLOSING, { size: 10, color: COLOR.ink, lineH: 4.4, gap: 6 });
  }

  flowText(CLOSING_LINE, { size: 10.5, style: "italic", color: COLOR.muted, lineH: 4.6, gap: 4 });

  if (unmatchedRetake) {
    flowText(UNMATCHED_RETAKE_NOTE, { size: 9.5, color: COLOR.muted, lineH: 4.2, gap: 4 });
  }
  if (declined) {
    flowText(DECLINE_RESULTS_NOTE, { size: 9.5, color: COLOR.muted, lineH: 4.2, gap: 4 });
  }

  // --- Footer disclosures ---
  ensureSpace(10);
  hr();
  y += 6;

  redBox(RESULTS_DISCLOSURE);
  flowText(
    declined
      ? "This report reflects your answers as of the date above. Nothing from this session was stored — this formatted document itself isn't stored anywhere either; save this copy now if you want to keep it."
      : "This report reflects your answers as of the date above. Your responses are stored securely so future comparisons keep working — this formatted document itself isn't stored anywhere; save this copy for your own records.",
    { size: 8.5, style: "italic", color: COLOR.muted, lineH: 3.9, gap: 3 },
  );

  const filename = `rewrite-your-life-assessment-${currentDate.slice(0, 10)}.pdf`;
  doc.save(filename);
}
