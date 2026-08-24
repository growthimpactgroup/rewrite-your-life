// Client-side PDF generation for the "download your report" action. Runs
// entirely in the browser — nothing is sent to or generated on a server, so
// the "we don't store this report, grab it now" copy on the results screen
// stays literally true. Uses jsPDF, the only new dependency this required.
//
// Structure follows the 16Personalities-factsheet shape Jeff referenced on
// the 2026-08-11 call (cover → per-area breakdown → overall summary) —
// adapted to our 9 trainable areas, not their content or wording.

import jsPDF from "jspdf";
import { ScoreSummary } from "./scoring";
import { Phase } from "./questions";
import {
  ANCHOR_LABELS,
  ANCHOR_INTERPRETATIONS,
  AI_ORCHESTRATION_INTERPRETATION,
  QAI_INTERPRETATION,
  QAI_SUBLABEL,
  formatTieList,
  RESULTS_DISCLOSURE,
  SIGNATURE_STRENGTH_COPY,
  TRAINING_FOCUS_COPY,
  PDF_NO_EMAIL_WARNING_DECLINED,
  PDF_NO_EMAIL_WARNING_SAVED,
  PDF_EDUCATION_LABEL,
  PDF_INTRO_FRAMING,
  rankDomains,
  buildJourneySummary,
} from "./resultsCopy";

type RGB = [number, number, number];

const COLOR = {
  primary: [37, 99, 235] as RGB, // Deep Blue
  ink: [30, 41, 59] as RGB, // Dark Slate
  muted: [100, 116, 139] as RGB, // Gray
  green: [21, 128, 61] as RGB,
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
}

export function generateReportPdf(params: ReportPdfParams): void {
  const { email, phase, declined, currentDate, current, baseline, mid, journey } = params;

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

  // Short interpretation paragraph under a row (anchors, AI rows) — same
  // dynamic-line-height pattern as disclosureBlock below, so long copy
  // can't get silently clipped at a page boundary.
  function paragraph(rawText: string) {
    const text = stripBold(rawText);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const lines = doc.splitTextToSize(text, contentWidth);
    const lineH = 3.8;
    ensureSpace(lines.length * lineH + 4);
    doc.setTextColor(...COLOR.muted);
    doc.text(lines, marginX, y);
    y += lines.length * lineH + 4;
  }

  // Compact "First X -> Second Y -> Now Z" trail — only drawn when a real
  // middle checkpoint exists, so the report shows all three submissions
  // instead of just first-vs-current.
  function trailLine(text: string) {
    ensureSpace(5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COLOR.muted);
    doc.text(text, marginX, y);
    y += 4.5;
  }

  function hr() {
    doc.setDrawColor(...COLOR.line);
    doc.setLineWidth(0.3);
    doc.line(marginX, y, pageWidth - marginX, y);
  }

  function redBox(text: string) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(text, contentWidth - 8);
    const lineH = 4.2;
    const boxH = lines.length * lineH + 6;
    ensureSpace(boxH + 4);
    doc.setDrawColor(...COLOR.redBorder);
    doc.setFillColor(...COLOR.redBg);
    doc.roundedRect(marginX, y, contentWidth, boxH, 2, 2, "FD");
    doc.setTextColor(...COLOR.red);
    doc.text(lines, marginX + 4, y + 5.5);
    y += boxH + 5;
  }

  function sectionHeader(title: string) {
    ensureSpace(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...COLOR.muted);
    doc.text(title.toUpperCase(), marginX, y);
    y += 6;
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
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...COLOR.ink);
  const introLines = doc.splitTextToSize(PDF_INTRO_FRAMING, contentWidth);
  doc.text(introLines, marginX, y);
  y += introLines.length * 4.2 + 4;

  redBox(RESULTS_DISCLOSURE);
  redBox(declined ? PDF_NO_EMAIL_WARNING_DECLINED : PDF_NO_EMAIL_WARNING_SAVED);

  hr();
  y += 8;

  // --- Signature strength / training focus ---
  // Box height is computed from the ACTUAL wrapped line count of whichever
  // side has more tied domains, not a fixed constant — a fixed 18mm box
  // let a long tie list (several domains tied at the max/min) run past the
  // box border when it wrapped to 2+ lines. Same dynamic-height pattern as
  // redBox/disclosureBlock below. Both boxes share one height so they still
  // line up side by side.
  if (current.signature.length > 0 || current.trainingFocus.length > 0) {
    const boxW = (contentWidth - 6) / 2;
    const calloutLineH = 4.6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    const sigValue =
      current.signature.length > 0
        ? formatTieList(current.signature.map((d) => d.label))
        : "";
    const tfValue =
      current.trainingFocus.length > 0
        ? formatTieList(current.trainingFocus.map((d) => d.label))
        : "";
    const sigLines = sigValue ? doc.splitTextToSize(sigValue, boxW - 8) : [];
    const tfLines = tfValue ? doc.splitTextToSize(tfValue, boxW - 8) : [];
    const neededLines = Math.max(sigLines.length, tfLines.length, 1);
    const boxH = 14 + (neededLines - 1) * calloutLineH + 4;

    ensureSpace(boxH + 10);

    const drawCallout = (x: number, label: string, lines: string[]) => {
      doc.setDrawColor(...COLOR.line);
      doc.roundedRect(x, y, boxW, boxH, 3, 3);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...COLOR.muted);
      doc.text(label, x + 4, y + 7);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11.5);
      doc.setTextColor(...COLOR.ink);
      doc.text(lines, x + 4, y + 14);
    };

    if (current.signature.length > 0) {
      drawCallout(marginX, "SIGNATURE STRENGTH", sigLines);
    }
    if (current.trainingFocus.length > 0) {
      drawCallout(marginX + boxW + 6, "TRAINING FOCUS", tfLines);
    }
    y += boxH + 10;
  }

  // --- Per-area breakdown, one block per trainable area ---
  sectionHeader("The Nine Trainable Areas");
  current.domains.forEach((d, i) => {
    const delta = baseline ? d.percent - baseline.summary.domains[i].percent : undefined;
    ensureSpace(28);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...COLOR.ink);
    doc.text(d.label, marginX, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    const scoreText = `${d.percent} out of 100`;
    const scoreWidth = doc.getTextWidth(scoreText);
    doc.text(scoreText, pageWidth - marginX - scoreWidth, y);

    if (delta !== undefined) {
      doc.setFontSize(9);
      const color = delta > 0 ? COLOR.green : COLOR.muted;
      doc.setTextColor(...color);
      const deltaText = delta === 0 ? "no change" : `${delta > 0 ? "+" : ""}${delta}%`;
      const deltaWidth = doc.getTextWidth(deltaText);
      doc.text(deltaText, pageWidth - marginX - scoreWidth - 4 - deltaWidth, y);
    }
    y += 5;

    if (baseline && mid) {
      trailLine(
        `First ${baseline.summary.domains[i].percent}  ·  Second ${mid.summary.domains[i].percent}  ·  Now ${d.percent}`,
      );
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR.green);
    doc.text("STRENGTHS", marginX, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.ink);
    const sigLines = doc.splitTextToSize(stripBold(SIGNATURE_STRENGTH_COPY[d.domain]), contentWidth);
    ensureSpace(sigLines.length * 4.2 + 8);
    doc.text(sigLines, marginX, y);
    y += sigLines.length * 4.2 + 3;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...COLOR.primary);
    doc.text("GROWTH AREAS", marginX, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.ink);
    const focusLines = doc.splitTextToSize(stripBold(TRAINING_FOCUS_COPY[d.domain]), contentWidth);
    ensureSpace(focusLines.length * 4.2 + 8);
    doc.text(focusLines, marginX, y);
    y += focusLines.length * 4.2 + 4;

    doc.setDrawColor(...COLOR.line);
    doc.setLineWidth(0.15);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 6;
  });

  // --- Life anchors --- (X out of 10, never a percentage)
  sectionHeader("Where You Stand");
  current.anchors.forEach((a) => {
    ensureSpace(9);
    const rowBaseline = y;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...COLOR.ink);
    doc.text(ANCHOR_LABELS[a.id] ?? "", marginX, rowBaseline, { maxWidth: contentWidth - 40 });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLOR.ink);
    const valueText = `${a.raw} out of 10`;
    const valueWidth = doc.getTextWidth(valueText);
    doc.text(valueText, pageWidth - marginX - valueWidth, rowBaseline);
    y = rowBaseline + 6;
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
    y += 3;
  });
  y += 4;

  // --- AI index ---
  function aiRow(
    label: string,
    percent: number,
    delta?: number,
    interpretation?: string,
    trail?: { first: number; second: number },
    sublabel?: string,
  ) {
    ensureSpace(9);
    const rowBaseline = y;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...COLOR.ink);
    doc.text(label, marginX, rowBaseline, { maxWidth: contentWidth - 40 });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLOR.ink);
    const percentText = `${percent} out of 100`;
    const percentWidth = doc.getTextWidth(percentText);
    doc.text(percentText, pageWidth - marginX - percentWidth, rowBaseline);
    if (delta !== undefined) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const color = delta > 0 ? COLOR.green : COLOR.muted;
      doc.setTextColor(...color);
      const deltaText = delta === 0 ? "no change" : `${delta > 0 ? "+" : ""}${delta}%`;
      const deltaWidth = doc.getTextWidth(deltaText);
      doc.text(deltaText, pageWidth - marginX - percentWidth - 5 - deltaWidth, rowBaseline);
    }
    y = rowBaseline + 6;
    if (sublabel) trailLine(sublabel);
    if (trail) {
      trailLine(`First ${trail.first}  ·  Second ${trail.second}  ·  Now ${percent}`);
    }
    if (interpretation) paragraph(interpretation);
    const dividerY = y - 1;
    doc.setDrawColor(...COLOR.line);
    doc.setLineWidth(0.15);
    doc.line(marginX, dividerY, pageWidth - marginX, dividerY);
    y += 3;
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
  y += 4;

  // --- Overall summary --- factual, not a new evidentiary claim: just
  // restates the same rank split shown on-screen.
  sectionHeader("Overall Summary");
  const ranks = rankDomains(current.domains);
  const doesWell = current.domains.filter((d) => ranks[d.domain] <= 5).map((d) => d.label);
  const growth = current.domains.filter((d) => ranks[d.domain] > 5).map((d) => d.label);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...COLOR.ink);
  const summaryText = `Across your nine areas, you're showing up strongest in ${formatTieList(doesWell)}. The areas with the most room to grow right now are ${formatTieList(growth)}.`;
  const summaryLines = doc.splitTextToSize(summaryText, contentWidth);
  ensureSpace(summaryLines.length * 4.4 + 6);
  doc.text(summaryLines, marginX, y);
  y += summaryLines.length * 4.4 + 6;

  // --- Journey ---
  if (journey && journey.length > 0) {
    sectionHeader("Your Journey");
    if (baseline && mid) {
      const journeyNarrative = buildJourneySummary([
        { summary: baseline.summary, dateLabel: formatDate(baseline.date) },
        { summary: mid.summary, dateLabel: formatDate(mid.date) },
        { summary: current, dateLabel: formatDate(currentDate) },
      ]);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...COLOR.ink);
      const narrativeLines = doc.splitTextToSize(stripBold(journeyNarrative), contentWidth);
      ensureSpace(narrativeLines.length * 4.4 + 6);
      doc.text(narrativeLines, marginX, y);
      y += narrativeLines.length * 4.4 + 6;
    }
    journey.forEach((point) => {
      ensureSpace(7);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...COLOR.muted);
      doc.text(`${point.label} · ${formatDate(point.date)}`, marginX, y);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...COLOR.ink);
      const text = `AI ${point.aiIndexPercent} out of 100`;
      doc.text(text, pageWidth - marginX - doc.getTextWidth(text), y);
      y += 6;
    });
    y += 4;
  }

  // --- Footer disclosures ---
  // Space reserved is computed from the ACTUAL wrapped line count, not a
  // fixed constant — a fixed reservation let long disclosure text render
  // past the page boundary and get silently cut off (bug found on the
  // 2026-08-10 review call).
  const DISCLOSURE_LINE_HEIGHT = 3.6; // mm, matches 8pt italic at jsPDF's default 1.15 line-height factor

  function disclosureBlock(text: string, fontStyle: "normal" | "italic") {
    doc.setFont("helvetica", fontStyle);
    doc.setFontSize(8);
    const lines = doc.splitTextToSize(text, contentWidth);
    ensureSpace(lines.length * DISCLOSURE_LINE_HEIGHT + 3);
    doc.setTextColor(...COLOR.muted);
    doc.text(lines, marginX, y);
    y += lines.length * DISCLOSURE_LINE_HEIGHT + 3;
  }

  ensureSpace(10);
  hr();
  y += 6;

  redBox(RESULTS_DISCLOSURE);
  disclosureBlock(
    declined
      ? "This report reflects your answers as of the date above. Nothing from this session was stored — this formatted document itself isn't stored anywhere either; save this copy now if you want to keep it."
      : "This report reflects your answers as of the date above. Your responses are stored securely so future comparisons keep working — this formatted document itself isn't stored anywhere; save this copy for your own records.",
    "italic",
  );

  const filename = `rewrite-your-life-assessment-${currentDate.slice(0, 10)}.pdf`;
  doc.save(filename);
}
