// Static copy for the Screen E v2 results rebuild. Deliberately separate
// from components/ResultsReportScreen.tsx — non-developers edit this file,
// nothing here is generated at runtime, and the headline-rule copy in
// particular is still draft content pending GIG-lead sign-off.

import { DomainScore, ScoreSummary } from "./scoring";

export const OPENING_FRAME_LINES = [
  "This is where you're standing today.",
  "Not a verdict, not a score — a starting position. Nine areas, measured honestly, on one page. Most people have never seen their own shape laid out like this.",
  "We're holding this map for you. In ten weeks you'll take it again, and you'll see exactly what moved.",
];

export const SHAPE_TITLE_DEFAULT = "YOUR SHAPE";
export const SHAPE_TITLE_WEEK10 = "YOUR FINISH MAP";
export const WEEK10_SUBHEAD = "Ten weeks, measured.";

export interface HeadlineRule {
  id: number;
  test: (domains: DomainScore[]) => boolean;
  copy: string;
}

function percentOf(domains: DomainScore[], code: string): number {
  return domains.find((d) => d.domain === code)?.percent ?? 0;
}

function bottomN(domains: DomainScore[], n: number): Set<string> {
  return new Set(
    [...domains]
      .sort((a, b) => a.percent - b.percent)
      .slice(0, n)
      .map((d) => d.domain),
  );
}

function spreadOf(domains: DomainScore[]): number {
  const percents = domains.map((d) => d.percent);
  return Math.max(...percents) - Math.min(...percents);
}

// Ordered, first-match-wins. Rule 8 always catches — see the build spec's
// "headline-read rule table" for the exact conditions.
export const HEADLINE_RULES: HeadlineRule[] = [
  {
    id: 1,
    test: (domains) => {
      const bottom = bottomN(domains, 3);
      return (
        bottom.has("PURPOSE") &&
        bottom.has("EXECUTION") &&
        domains.filter((d) => d.percent > 70).length >= 3
      );
    },
    copy:
      "You have more capacity than you're currently pointing anywhere. The hard part is already there — thinking, steadiness, recovery. What's thin is aim and follow-through. Your next gain probably isn't more capability. It's direction.",
  },
  {
    id: 2,
    test: (domains) => percentOf(domains, "PURPOSE") > 70 && bottomN(domains, 3).has("EXECUTION"),
    copy:
      "You know why. The gap is in how. Your direction is clear — clearer than most people ever get. What's not yet built is the machinery that turns it into finished work.",
  },
  {
    id: 3,
    test: (domains) => percentOf(domains, "EXECUTION") > 70 && bottomN(domains, 3).has("PURPOSE"),
    copy:
      "You finish things. The open question is whether they're the right things. Follow-through is rare and you have it. Aimed deliberately, it compounds; aimed by default, it just fills the calendar.",
  },
  {
    id: 4,
    test: (domains) => domains.every((d) => d.percent > 60),
    copy:
      "This is a consolidated map — no obvious hole. Your next gains won't come from fixing a weakness. They'll come from raising a ceiling.",
  },
  {
    id: 5,
    test: (domains) => domains.every((d) => d.percent < 40),
    copy:
      "Everything on this page is a lever. A low starting map isn't bad news — it's the profile with the most room to move in ten weeks, and the one where small changes show up fastest.",
  },
  {
    id: 6,
    test: (domains) => spreadOf(domains) < 20,
    copy:
      "Your map is even. No single domain is carrying you and none is holding you back — which means progress here is about depth, not repair.",
  },
  {
    id: 7,
    test: (domains) => spreadOf(domains) > 50,
    copy:
      "Your map is uneven, and that's useful. Real strengths sitting beside real gaps is the most workable profile there is — you already know what the next ten weeks are for.",
  },
  {
    id: 8,
    test: () => true,
    copy:
      "Here's your shape. Two areas are carrying more than the rest, and two have room. That's the map for the next ten weeks.",
  },
];

export function selectHeadline(domains: DomainScore[]): string {
  return (
    HEADLINE_RULES.find((r) => r.test(domains)) ?? HEADLINE_RULES[HEADLINE_RULES.length - 1]
  ).copy;
}

// 18 interpretation strings (9 domains x 2) — draft copy, pending GIG-lead
// sign-off, keyed by the canonical domain codes in lib/scoring.ts.
export const SIGNATURE_STRENGTH_COPY: Record<string, string> = {
  "CLEAR THINKING":
    "You can hold complexity without losing the thread. That's the capacity most people are missing when decisions stall — lead with it, and let it carry the areas still building.",
  EMOTIONAL:
    "You stay curious when most people go defensive. That's not politeness; it's the thing that keeps information flowing toward you when it stops flowing toward everyone else.",
  ADVERSITY:
    "You get back up the same day. Over ten weeks that's not a personality trait — it's a compounding advantage, because you spend fewer days not moving.",
  FRAME:
    "You set the temperature of a room instead of absorbing it. Most people don't know that's a choice. You're already making it.",
  LEARNING:
    "You change your mind when the evidence changes. That's rarer than it sounds, and it's why you'll get more out of the next ten weeks than someone who has to be right.",
  SITUATIONAL:
    "You read a room before it declares itself. You're working with information other people won't have for another week.",
  PRESENCE:
    "Under pressure, other people steady themselves on you. That's a form of leverage that has nothing to do with your title.",
  PURPOSE:
    "Your days point the same direction as your life. Most people never close that gap — and everything else you build now compounds instead of scattering.",
  EXECUTION:
    "You finish. The excitement wears off and you keep going. That single habit outperforms most talent, most of the time.",
};

export const TRAINING_FOCUS_COPY: Record<string, string> = {
  "CLEAR THINKING":
    "Under load, your options blur together and decisions get made by whatever's loudest. **First move:** on the next real decision, write the options and their trade-offs down before choosing. On paper, not in your head.",
  EMOTIONAL:
    "Defensiveness is expensive — it costs you the information people were about to give you. **First move:** one full breath before responding to anything that stings. Just the breath, nothing else.",
  ADVERSITY:
    "Setbacks are costing you days rather than hours, and the days add up faster than the setbacks do. **First move:** next time something goes wrong, name out loud how long you plan to be down. Then cut it in half.",
  FRAME:
    "You're absorbing the temperature of hard conversations instead of setting it — and leaving some of them having agreed to things you didn't want. **First move:** before the next tense conversation, decide your tone in advance. Walk in already holding it.",
  LEARNING:
    "You're defending positions past the point the evidence supports them. **First move:** name one thing you currently believe about your work that you'd change if you saw good evidence against it. Then go looking.",
  SITUATIONAL:
    "Things are surprising you that were visible in advance to someone watching. **First move:** before your next meeting, write down who wants what. Two minutes. You'll be right more often than you expect.",
  PRESENCE:
    "When pressure spikes, it shows — and the people around you calibrate off what they see. **First move:** slow your speech when the stakes rise. It's the fastest available lever and it works before you feel calmer.",
  PURPOSE:
    "Your days are full, but they're not yet pointed. This is the area that quietly decides whether the other eight compound or just keep you busy. **First move:** name the one thing that matters most this week and put it on the calendar before anything else fills the space.",
  EXECUTION:
    "You start more than you finish, and the half-done things are taking up room. **First move:** pick one open loop and close it this week. Not the biggest one — the one that's been open longest.",
};

// Ties: two tied domains join with "&"; three or more pluralize the card
// title and list all, never broken by list order.
export function formatTieList(labels: string[]): string {
  if (labels.length <= 1) return labels[0] ?? "";
  if (labels.length === 2) return `${labels[0]} & ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

export function cardTitle(base: "Signature Strength" | "Training Focus", count: number): string {
  if (count <= 2) return base;
  return base === "Signature Strength" ? "Signature Strengths" : "Training Focus Areas";
}

export const ANCHOR_LABELS: Record<number, string> = {
  19: "Life satisfaction",
  20: "Clear mornings",
  21: "12-month confidence",
};

export const ANCHOR_CAPTION =
  "These three aren't skills. They're the read on whether the other nine are adding up to a life you want.";

// What a change in each anchor reflects, in plain language. The reasoning
// is grounded in credible published research (see conversation record for
// the source list), but no study names or institutions are named in the
// app copy itself — framed the same way as SCORE_SCALE_EXPLANATION:
// describes what a change reflects, not a diagnosis or prediction.
export const ANCHOR_INTERPRETATIONS: Record<number, string> = {
  19: "This is your own overall read on how your life is going right now — work, relationships, and health together, not any one piece. If this number goes up, **that overall sense has genuinely improved.** If it drops, treat it as a prompt to figure out which of those three moved — not as a verdict.",
  20: "This tracks how many mornings you started with a decided priority already in place, instead of figuring it out as the day goes. A higher number means more of your days start with a plan already set. **A lower number is a fixable habit, not a trait** — deciding tonight what tomorrow's priority is tends to move this.",
  21: "This is how much you currently believe your own actions are steering the next 12 months. A higher number means you feel in control of where things are headed. **A lower number doesn't mean the year is set** — that belief is built through repeated small wins, so it's genuinely buildable.",
};

export const AI_ORCHESTRATION_CAPTION =
  "This one question is asked in every room we measure, and it's the line we'll still be tracking in 2029.";

// Small inline clarifier under the "Q-AI" label itself — added because
// people kept asking what Q-AI meant even after AI_ORCHESTRATION_CAPTION
// and QAI_INTERPRETATION already existed; the name alone reads as jargon on
// first glance, so it needed a clarifier right at the label, not just below
// both rows. Kept "Q-AI" as the name rather than renaming it, since the
// caption above implies it's a metric tracked by name over time.
export const QAI_SUBLABEL = "One specific question, not an average";

// Plain-language read on the two AI rows — describes the behaviors the
// underlying questions actually ask about (Q22-27), not an external claim.
export const AI_ORCHESTRATION_INTERPRETATION =
  "This score reflects how often you hand AI real work, set clear standards for it, and verify selectively instead of either trusting it blindly or re-checking everything. A higher number means AI already functions like a managed team member in your work. **A lower number usually means you're still using it more like a search box** — a specific, fixable habit, not a skill gap.";
export const QAI_INTERPRETATION =
  "This single question asks whether you hand AI an actual task with a goal, or mostly just ask it things. A higher number means you're already doing the former. A lower number points to one concrete next step: **next time, give AI a real task to own** — not a one-off question — and see what changes.";

export const CLOSING_LINE = "Most people never measure this. You just did.";

export const UNMATCHED_RETAKE_NOTE =
  "We don't have an earlier map for this address, so this one is your starting point.";

// Continuity box (replaces the old "Save this now" box).
export const CONTINUITY_HEADLINE = "Your map is saved.";
export const CONTINUITY_BODY =
  "Come back to this link with **the same email** any time — your map will be here, along with everything that's moved since.";
export const CONTINUITY_WEEK10_PREFIX = "Your week-10 finish map: ";
export const CONTINUITY_CLOSING = "Six minutes. It's the only way to see what actually changed.";

// Jeff review calls, 2026-08-10 & 2026-08-11 (x2).
export const THE_NINE_TITLE = "The Nine Trainable Areas";
export const DOES_WELL_BUCKET_TITLE = "Things You Do Well";
export const GROWTH_BUCKET_TITLE = "Things You Could Grow";
// 2026-08-11: shortened to "Education only" per Jeff's exact wording,
// styled red/boxed so it isn't missed.
export const RESULTS_DISCLOSURE = "This is not a professional or medical assessment. Education only.";
// We keep the underlying answers (so future comparisons work), but never
// retain a copy of this formatted view/report itself — that's on the
// person to save if they want one.
export const SAVE_YOUR_COPY_NOTE =
  "Save this copy for your records — we don't keep a copy of this report for you. (Your underlying answers do stay on file, so future comparisons will still work.)";
// Declined path's equivalent caution — its own red box directly above the
// PDF button, same treatment as SAVE_YOUR_COPY_NOTE above, since nothing
// from a declined session is stored anywhere at all.
export const DECLINED_SAVE_NOW_WARNING =
  "Save this now — this result isn't stored anywhere. Download or print it before you leave this page, because it can't be recovered afterward.";

// Explains the SCALE, not any individual score's implications — deliberately
// stays inside what's defensible without the Section-5 citation sheet (no
// claim about what a score means or predicts, just what the number itself
// represents: how often the behavior shows up for you). Positive framing
// per Jeff's explicit "room for improvement, not deficiency" note.
export const SCORE_SCALE_EXPLANATION =
  "Every score here is self-reported, **not diagnostic.** A lower number just means that behavior shows up less often for you right now — not that anything is wrong. A higher number means it's become a consistent, automatic part of how you operate. Every area on this page is trainable — **a lower score today is room to grow, not a verdict.**";

// PDF-only red warning banner (Section 4 of the 2026-08-11 spec).
// Aug 11 call, "Open Items": "Cannot claim data isn't saved unless that's
// actually true — confirm backend behavior matches this copy before
// shipping it." It doesn't, for most people: a consented submission's
// answers ARE saved (that's what makes retakes work) — only a decline
// writes zero rows. So this is two different, both-true statements, not
// one blanket claim:
export const PDF_NO_EMAIL_WARNING_DECLINED =
  "We will not email this to you. This is the only time you can download it. We do not save your data — nothing from this session was stored, anywhere. This is for your use only, one time. Click download to save.";
export const PDF_NO_EMAIL_WARNING_SAVED =
  "We will not email this to you. This is the only time you can download this exact report. We don't keep a copy of this PDF — your underlying answers do stay on file, so future comparisons will still work. This is for your use only, one time. Click download to save.";
export const PDF_EDUCATION_LABEL = "EDUCATION ONLY";
// Purely procedural — how to read the report, not a claim about what any
// score means, so it doesn't need the Section 5 citation sheet.
export const PDF_INTRO_FRAMING =
  "This report walks through each of your nine trainable areas one at a time — your score, what that area looks like when it's a strength, and where to focus next. Scores are shown as a percentage (out of 10 for the three life-anchor questions).";
// Section 5 (2026-08-11 spec) requires a real citation sheet before any
// "what a high/low score means" narrative is written — that research
// hasn't been done yet. Placeholder-free by design: rather than print an
// ugly "[pending]" note in a document real people download, this line is
// simply left out of the PDF until that copy exists.

/** 1-based rank per domain among the given set, 1 = highest percent. Ties
 * broken by DOMAIN_ORDER position (stable sort), never by insertion order. */
export function rankDomains(domains: DomainScore[]): Record<string, number> {
  const sorted = [...domains].sort((a, b) => b.percent - a.percent);
  const ranks: Record<string, number> = {};
  sorted.forEach((d, i) => {
    ranks[d.domain] = i + 1;
  });
  return ranks;
}

export function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** "X weeks, Y days apart" — elapsed time between two submission dates,
 * per Jeff's ask for the comparison screen. */
export function formatElapsed(fromIso: string, toIso: string): string {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  const totalDays = Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  const weekPart = weeks > 0 ? `${weeks} week${weeks === 1 ? "" : "s"}` : "";
  const dayPart = days > 0 ? `${days} day${days === 1 ? "" : "s"}` : "";

  if (weekPart && dayPart) return `${weekPart}, ${dayPart} apart`;
  if (weekPart) return `${weekPart} apart`;
  if (dayPart) return `${dayPart} apart`;
  return "same day";
}

/** "On Aug 1, 2026 you were 45%. On Oct 10, 2026 you are now 70%." — the
 * explicit before/after sentence Jeff asked for, per row. Values are passed
 * pre-formatted (with their own unit — %, /10, points) so this works for
 * domains, AI Orchestration, and anchors alike. */
export function beforeAfterSentence(
  formatDate: (iso: string) => string,
  prevDate: string,
  prevValue: string,
  currentDate: string,
  currentValue: string,
): string {
  return `On ${formatDate(prevDate)} you were ${prevValue}. On ${formatDate(currentDate)} you are now ${currentValue}.`;
}

export interface JourneyCheckpoint {
  summary: ScoreSummary;
  dateLabel: string;
}

function avgDomainPercent(summary: ScoreSummary): number {
  return summary.domains.reduce((sum, d) => sum + d.percent, 0) / summary.domains.length;
}

/** Collectively analyzes all three check-ins (first, second, now) into one
 * narrative — the week-10 "Finish my Journey" screen previously only ever
 * compared current-vs-first, silently skipping the middle (retake) data
 * point entirely. Purely computed from the user's own three data points,
 * same "factual, not evidentiary" pattern as the PDF's Overall Summary —
 * no external or fabricated claim about what any score means. */
export function buildJourneySummary(
  points: [JourneyCheckpoint, JourneyCheckpoint, JourneyCheckpoint],
): string {
  const [first, second, third] = points;
  const avg1 = avgDomainPercent(first.summary);
  const avg2 = avgDomainPercent(second.summary);
  const avg3 = avgDomainPercent(third.summary);
  const leg1 = avg2 - avg1;
  const leg2 = avg3 - avg2;
  const FLAT = 3; // point-swing under this counts as "held steady" for that leg

  let trendPhrase: string;
  if (leg1 >= FLAT && leg2 >= FLAT) {
    trendPhrase = "climbed steadily across all three check-ins";
  } else if (leg1 <= -FLAT && leg2 <= -FLAT) {
    trendPhrase = "declined across both check-ins since you started";
  } else if (leg1 <= -FLAT && leg2 >= FLAT) {
    trendPhrase =
      avg3 >= avg1
        ? "dipped after your first check-in, then recovered past where you started"
        : "dipped after your first check-in, then partly recovered";
  } else if (leg1 >= FLAT && leg2 <= -FLAT) {
    trendPhrase =
      avg3 >= avg1
        ? "gained after your first check-in, then gave a little of it back — still net up overall"
        : "gained after your first check-in, then gave back most of it";
  } else {
    trendPhrase = "held remarkably steady across all three check-ins";
  }

  // Biggest single-domain mover across the full stretch (first -> now).
  let riser: { label: string; change: number } | null = null;
  let decliner: { label: string; change: number } | null = null;
  third.summary.domains.forEach((d, i) => {
    const change = d.percent - first.summary.domains[i].percent;
    if (change > 0 && (!riser || change > riser.change)) riser = { label: d.label, change };
    if (change < 0 && (!decliner || change < decliner.change)) decliner = { label: d.label, change };
  });

  const sentences = [
    `Across your three check-ins — ${first.dateLabel}, ${second.dateLabel}, and ${third.dateLabel} — your overall map **${trendPhrase}.**`,
  ];
  if (riser) {
    const r: { label: string; change: number } = riser;
    sentences.push(
      `**${r.label}** moved the most, up **${r.change} points** since your first check-in.`,
    );
  }
  if (decliner) {
    const d: { label: string; change: number } = decliner;
    sentences.push(
      `**${d.label}** is the one still slipping, down **${Math.abs(d.change)} points** over the same stretch.`,
    );
  }
  const aiChange = third.summary.aiIndexPercent - first.summary.aiIndexPercent;
  if (aiChange !== 0) {
    sentences.push(
      `Your AI Orchestration score ${aiChange > 0 ? "climbed" : "dropped"} **${Math.abs(aiChange)} points** over the same three checks.`,
    );
  }
  return sentences.join(" ");
}

/** Clear, unambiguous change label — never a bare "+25". One number, one
 * unit, matching whatever's already shown alongside it (2026-08-11: reading
 * "20 point increase (67% increase)" as two different-looking percentages
 * for the same change was the exact "not cohesive" complaint this fixes —
 * domains/AI are already shown as a %, so the change is a % too). Anchors
 * pass unit="" since they're X/10, never a percentage. */
export function changeLabel(pointsChange: number, unit: string = "%"): string {
  if (pointsChange === 0) return "No change";
  const direction = pointsChange > 0 ? "increase" : "decrease";
  const sign = pointsChange > 0 ? "+" : "−";
  return `${sign}${Math.abs(pointsChange)}${unit} ${direction}`;
}
