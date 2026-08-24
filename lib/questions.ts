// Instrument for Rewrite Your Life. Originally Section 4 of the build brief
// (frozen wording); revised on 2026-07-22 per Jeff's (GIG lead) review call
// feedback — reworded into direct, second-person questions with examples.
// This revision happened pre-freeze (no real submissions exist yet), which
// is exactly the one-time GIG-lead gate the brief describes. Wording is
// frozen from the first real submission onward — do not edit after that.

export type ScaleType = "frequency" | "ai-use";

export interface AnswerOption {
  value: number;
  label: string;
}

// Items 1–21
export const FREQUENCY_OPTIONS: AnswerOption[] = [
  { value: 0, label: "Not me at all" },
  { value: 3, label: "Occasionally" },
  { value: 5, label: "About half the time" },
  { value: 8, label: "Most of the time" },
  { value: 10, label: "Consistently — it's how I operate" },
];

// Items 22–27
export const AI_USE_OPTIONS: AnswerOption[] = [
  { value: 0, label: "Never" },
  { value: 3, label: "Tried it" },
  { value: 5, label: "Sometimes" },
  { value: 8, label: "Regularly — part of how I work" },
  { value: 10, label: "It's simply how I work" },
];

export interface Question {
  /** 1–27, fixed order, matches items[] index in the raw table (1-based). */
  id: number;
  /** Database-only grouping label. Never rendered on screen. */
  domain: string;
  /** Direct, second-person question. */
  text: string;
  /** Short concrete example shown under the question, if any. */
  example?: string;
  /** Reverse-scored at scoring time only (10 − answer). Never reflected in the UI. */
  reverse: boolean;
  scale: ScaleType;
}

export const QUESTIONS: Question[] = [
  { id: 1, domain: "CLEAR THINKING", text: "Can you clearly see your options when you have a big decision to make?", example: "like choosing between a job with better pay or one with more flexibility", reverse: false, scale: "frequency" },
  { id: 2, domain: "CLEAR THINKING", text: "Does your thinking stay organized when you're under time pressure?", example: "a deadline crunch where your to-do list still makes sense", reverse: false, scale: "frequency" },

  { id: 3, domain: "EMOTIONAL", text: "When someone's upset with you, do you stay curious about why instead of getting defensive?", example: "asking “what happened?” instead of “that's not fair”", reverse: false, scale: "frequency" },
  { id: 4, domain: "EMOTIONAL", text: "Do you pause before acting on a strong emotional reaction?", example: "a breath before firing back a reply", reverse: false, scale: "frequency" },

  { id: 5, domain: "ADVERSITY", text: "When something goes badly wrong, are you back to functioning that same day?", example: "a bad meeting doesn't take you out for the rest of the week", reverse: false, scale: "frequency" },
  { id: 6, domain: "ADVERSITY", text: "After a rejection or failure, do you recover your motivation quickly?", example: "a “no” doesn't stop you from trying again soon after", reverse: false, scale: "frequency" },

  { id: 7, domain: "FRAME", text: "In a tense conversation, do you set the tone instead of absorbing the other person's?", example: "staying steady even when they're heated", reverse: false, scale: "frequency" },
  { id: 8, domain: "FRAME", text: "Do you ever leave a conversation realizing you agreed to something you didn't actually want?", example: "saying yes just to end an uncomfortable back-and-forth", reverse: true, scale: "frequency" },

  { id: 9, domain: "LEARNING", text: "When new information contradicts what you believed, do you update your view quickly?", example: "changing your plan once the data proves you wrong", reverse: false, scale: "frequency" },
  { id: 10, domain: "LEARNING", text: "When your usual approach stops working, do you switch tactics quickly?", example: "trying something new instead of repeating what isn't working", reverse: false, scale: "frequency" },

  { id: 11, domain: "SITUATIONAL", text: "Walking into a room, can you quickly read who's friendly, neutral, or against you?", example: "sensing the room before anyone says a word", reverse: false, scale: "frequency" },
  { id: 12, domain: "SITUATIONAL", text: "Do you tend to see problems coming before they actually arrive?", example: "spotting a risk before it becomes a crisis", reverse: false, scale: "frequency" },

  { id: 13, domain: "PRESENCE", text: "In high-stress moments, do you stay calm enough that others look to you for direction?", example: "being the steady one when everyone else is panicking", reverse: false, scale: "frequency" },
  { id: 14, domain: "PRESENCE", text: "When pressure suddenly spikes, do others notice you visibly lose your composure?", example: "your voice, face, or hands giving it away", reverse: true, scale: "frequency" },

  { id: 15, domain: "PURPOSE", text: "Do your daily actions actually line up with what you say matters most to you?", example: "your calendar reflecting your stated priorities", reverse: false, scale: "frequency" },
  { id: 16, domain: "PURPOSE", text: "Does a clear sense of purpose guide your big decisions?", example: "choosing a path because it fits your bigger why, not just what's easiest", reverse: false, scale: "frequency" },

  { id: 17, domain: "EXECUTION", text: "Do you finish what you start, even after the initial excitement wears off?", example: "still showing up once the novelty fades", reverse: false, scale: "frequency" },
  { id: 18, domain: "EXECUTION", text: "Do you close loops quickly, or do things linger half-done for weeks?", example: "that email that's been “almost done” for a month", reverse: false, scale: "frequency" },

  { id: 19, domain: "LIFE ANCHORS", text: "Overall, how satisfied are you with your life right now?", example: "thinking about work, relationships, and health together", reverse: false, scale: "frequency" },
  { id: 20, domain: "LIFE ANCHORS", text: "Out of the last 14 mornings, how many did you wake up already knowing your top priority for the day? (10 = 14 of 14)", reverse: false, scale: "frequency" },
  { id: 21, domain: "LIFE ANCHORS", text: "How confident are you that the next 12 months are headed where you want them to go?", reverse: false, scale: "frequency" },

  { id: 22, domain: "AI ORCHESTRATION INDEX", text: "Q-AI: Do you hand real work to AI and direct it like a team member, not just ask it questions?", example: "assigning it a task with a goal, not a one-off question", reverse: false, scale: "ai-use" },
  { id: 23, domain: "AI ORCHESTRATION INDEX", text: "Can you tell when to trust an AI's output and when you need to verify it yourself?", example: "double-checking a number before you use it, not everything", reverse: false, scale: "ai-use" },
  { id: 24, domain: "AI ORCHESTRATION INDEX", text: "Do you use AI weekly in your actual work, not just to experiment with it?", reverse: false, scale: "ai-use" },
  { id: 25, domain: "AI ORCHESTRATION INDEX", text: "Does AI genuinely save you time and effort, or does keeping up with it cost you more than it gives back?", example: "fewer hours spent vs. more prompts, tools, and outputs to check", reverse: false, scale: "ai-use" },
  { id: 26, domain: "AI ORCHESTRATION INDEX", text: "Do you give AI clear roles, standards, and review — the way you'd manage a team?", example: "defining what “good” looks like before it starts", reverse: false, scale: "ai-use" },
  { id: 27, domain: "AI ORCHESTRATION INDEX", text: "Are you keeping pace with how fast AI is changing, or falling behind?", example: "trying new tools or models as they come out, vs. still using what you learned a year ago", reverse: false, scale: "ai-use" },
];

export const TOTAL_QUESTIONS = QUESTIONS.length; // 27

export function optionsFor(scale: ScaleType): AnswerOption[] {
  return scale === "frequency" ? FREQUENCY_OPTIONS : AI_USE_OPTIONS;
}

// --- Phase (entry screen) ---

export type Phase = "first" | "retake" | "week10";

export const PHASE_OPTIONS: { phase: Phase; label: string; helper: string }[] = [
  { phase: "first", label: "Start My Journey", helper: "First time here" },
  {
    phase: "retake",
    label: "Continue My Journey",
    helper: "Taking it again — show me what's moved",
  },
  { phase: "week10", label: "Finish My Journey", helper: "Week 10 — my finish map" },
];

// Shared with QuestionScreen so the entry-screen tap-confirm-advance beat
// stays in lockstep with the question screens, per the Screen A build spec.
export const CONFIRM_DELAY_MS = 450;

// --- Screen copy ---

export const ENTRY_HEADLINE = "Your Journey. Six Minutes.";
export const ENTRY_SUBTEXT = "No wrong answers — just an honest read on where you are.";
export const ENTRY_FRAMING_LINE = "Six minutes. 27 questions, one tap each.";

// PLACEHOLDER — Screen A build spec §2 Block E marks this as unapproved:
// "Do not ship the placeholder without Grace's sign-off." Swap this string
// for the Growth Impact Group–approved text before treating it as final.
export const ENTRY_DISCLAIMER =
  "Your answers are stored anonymously and reported only as group averages. Your email is used for **one purpose — matching your results to you over time.**";
// Jeff review call, 2026-08-11: split out and styled red/boxed so it isn't
// missed, per his explicit note on this exact sentence.
export const ENTRY_EMAIL_NOTICE_RED =
  "We never send you anything — the system has no email-sending capability at all. Individual answers are never published.";

export const EMAIL_COPY = "So your results can find you next time.";
// Screen B build spec: only one reassurance statement on this screen, said
// once, directly beneath the button.
export const EMAIL_REASSURANCE =
  "Used only to match your results to you over time. **We never send you anything** — the system has no email-sending capability at all.";
export const EMAIL_ERROR = "That doesn't look like an email address — mind checking it?";

// Early continuity check on the email screen — catches two real ways
// someone's own journey silently breaks: a typo'd email on a retake/week10
// (nothing matches, and they'd only find out after 6 minutes of questions),
// or picking "Start My Journey" again on an email that already has results.
// Soft warning only, never a hard block — "Continue anyway" always works.
export const EMAIL_CHECK_NONE_FOUND =
  "We don't have any prior results saved under this email. If you're retaking the test, **double-check you typed the exact same email as last time** — or continue if this is intentional.";
export const EMAIL_CHECK_DUPLICATE_FIRST =
  "You already have results saved under this email. If that's you, **go back and choose \"Continue My Journey\" instead** — or continue if you meant to start fresh.";
export const EMAIL_CHECK_GO_BACK_LABEL = "Go back";
export const EMAIL_CHECK_CONTINUE_LABEL = "Continue anyway";

// "Before you begin" (Screen B2) build spec: never say "Clarity" here — it's a
// scored domain name on the results screen and collides with it.
export const QUESTIONS_INTRO_HEADLINE = "Before you begin.";
// Split into two short, flowing lines instead of one dense technical
// sentence — a punchy hook, then the substance. Must still name all nine
// domains or none (never a partial list), just framed as a continuation
// ("how you actually operate") rather than a cold enumeration.
export const QUESTIONS_INTRO_BODY_LINES = [
  "**Twenty-seven questions. One tap each.** That's the whole thing.",
  "Together they map **nine areas of how you actually operate** — clear thinking, emotional steadiness, adversity, frame, learning, situational awareness, presence, purpose, and execution — plus how you're really using AI right now.",
];

// Phase-aware confirmation line — exactly one variant renders, matching the
// phase chosen on Screen A. Catches a wrong-button tap before six minutes
// are spent; never show retake/week-10 language to a first-time participant.
export const QUESTIONS_INTRO_PHASE_CONFIRMATION: Record<Phase, string> = {
  first:
    "This is your starting map. **Answer honestly** — it's the line everything else gets measured against.",
  retake: "You've mapped this before. **At the end you'll see what's moved** since last time.",
  week10:
    "This is your week-ten finish map. **At the end you'll see everything that moved** in ten weeks.",
};

// Screen B2 consent-framing line, directly above the Begin button. Display
// only — tapping Begin is not a consent action. Formal consent (the actual
// data-writing gate) stays on the end-of-flow ConsentScreen.
export const QUESTIONS_INTRO_CONSENT_LINE =
  "By tapping Begin, you agree that your responses may be used in anonymous, aggregated form to improve and validate the program. Your individual answers are **never published.**";
// Jeff review call, 2026-08-10: clinical-disclaimer requirement for Screen
// B2. 2026-08-11: "Education only" appended, styled red/boxed.
export const QUESTIONS_INTRO_CLINICAL_DISCLOSURE =
  "This is not a medical diagnostic, mental health test, or clinical assessment of any kind. Education only.";
// Data-handling notice (Section 6 of the build spec) — a notice, not a
// second consent gate. No checkbox, no tap required, no blocking.
export const QUESTIONS_INTRO_NOTICE_LINE =
  "Your answers are stored anonymously and reported only as **group averages.** You'll confirm this at the end.";

export const CONSENT_TEXT =
  "My responses may be used in anonymous, aggregated form to improve and validate the program.";
export const CONSENT_DISCLOSURE =
  "Your answers are stored securely and only ever reviewed in anonymized, aggregated form — **never linked back to you individually** — to help us improve and validate this assessment over time.";
// Screen D decline path (Section 6 of the build spec) — declining still
// shows full results; only a bare tally is logged, no answers or email.
export const DECLINE_OPTION_LABEL = "I'd rather not — discard my answers";
export const DECLINE_CONFIRM_HEADLINE = "Discard your answers?";
export const DECLINE_CONFIRM_BODY =
  "You'll still see your results. **Nothing will be stored**, and this session won't be part of the program's record.";
export const DECLINE_CONFIRM_ACTION = "Discard and show my results";
export const DECLINE_CONFIRM_CANCEL = "Go back";
export const DECLINE_RESULTS_NOTE =
  "These results are yours alone — nothing from this session was stored.";
