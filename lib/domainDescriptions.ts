// 2026-08-26, at Frances's request — a first-time visitor couldn't tell
// what "AI Orchestration Index" or "Frame Control" actually measure, or
// what a given result means. Each entry here is grounded in that domain's
// two actual frozen questions (lib/questions.ts), written fresh in plain,
// third-person, group-level language for this page — not copied from the
// survey app's own second-person "you" copy in lib/resultsCopy.ts, which
// describes an individual's own score, not a group's average.
//
// `rose` / `fell` / `flat` are shown depending on the real direction of
// that metric's actual delta, so the interpretation never claims a
// direction the data doesn't support.
export interface DomainDescription {
  what: string;
  rose: string;
  fell: string;
  flat: string;
}

export const DOMAIN_DESCRIPTIONS: Record<string, DomainDescription> = {
  clear_thinking: {
    what: "How clearly someone can weigh their options and stay organized once a decision is under time pressure.",
    rose: "On average, finishers are weighing decisions more clearly and staying more organized under pressure than when they started.",
    fell: "On average, finishers found decisions harder to weigh clearly and pressure harder to stay organized under, compared to when they started.",
    flat: "On average, finishers' ability to think clearly under pressure didn't change.",
  },
  emotional: {
    what: "How steady someone stays emotionally — pausing before reacting, and staying curious instead of defensive when someone's upset with them.",
    rose: "On average, finishers are staying calmer and more curious instead of defensive when things get emotionally charged.",
    fell: "On average, finishers are reacting more defensively and less calmly than when they started.",
    flat: "On average, finishers' emotional steadiness didn't change.",
  },
  adversity: {
    what: "How quickly someone gets back to functioning after something goes badly wrong, and how fast their motivation recovers after a setback.",
    rose: "On average, finishers are bouncing back from setbacks faster than when they started.",
    fell: "On average, finishers are taking longer to recover from setbacks than when they started.",
    flat: "On average, finishers' recovery speed after a setback didn't change.",
  },
  frame: {
    what: "Whether someone sets the tone in a tense conversation instead of absorbing the other person's, and whether they hold their ground instead of agreeing to things they didn't want.",
    rose: "On average, finishers are holding their ground and setting the tone in tense conversations more than when they started.",
    fell: "On average, finishers are getting pulled into the other person's tone in tense conversations more than when they started.",
    flat: "On average, finishers' ability to hold the tone in a tense conversation didn't change.",
  },
  learning: {
    what: "How quickly someone updates their thinking when new evidence contradicts it, and how fast they switch tactics once their usual approach stops working.",
    rose: "On average, finishers are updating their thinking and switching approach faster once the evidence says they should.",
    fell: "On average, finishers are slower to update their thinking or switch approach than when they started.",
    flat: "On average, finishers' speed at updating their thinking didn't change.",
  },
  situational: {
    what: "How quickly someone reads a room — who's friendly, neutral, or against them — and how early they spot a problem before it arrives.",
    rose: "On average, finishers are reading rooms and spotting problems earlier than when they started.",
    fell: "On average, finishers are noticing problems later, and reading rooms less quickly, than when they started.",
    flat: "On average, finishers' read on a room didn't change.",
  },
  presence: {
    what: "How calm someone stays in a high-stress moment, and whether that composure is visible to the people around them.",
    rose: "On average, finishers are staying calmer under real pressure, with less visible loss of composure, than when they started.",
    fell: "On average, finishers are visibly losing composure under pressure more than when they started.",
    flat: "On average, finishers' composure under pressure didn't change.",
  },
  purpose: {
    what: "How closely someone's daily actions line up with what they say matters most to them, and how much a clear sense of purpose guides their big decisions.",
    rose: "On average, finishers' daily actions and big decisions are lining up more closely with what actually matters to them.",
    fell: "On average, finishers' daily actions are lining up less closely with what matters most to them than when they started.",
    flat: "On average, how closely finishers' actions match their stated priorities didn't change.",
  },
  execution: {
    what: "How reliably someone finishes what they start once the initial excitement wears off, and how quickly they close loops instead of leaving things half-done.",
    rose: "On average, finishers are finishing more of what they start and closing more loops instead of leaving things half-done.",
    fell: "On average, finishers are leaving more things half-done, and closing fewer loops, than when they started.",
    flat: "On average, finishers' follow-through didn't change.",
  },
  ai_index: {
    what: "How much someone hands AI real, meaningful work with clear standards, and checks the results selectively — instead of either trusting it blindly or re-checking everything.",
    rose: "On average, finishers are handing AI real tasks with clear standards, and checking the results selectively, more than when they started — closer to directing a team member than typing into a search box.",
    fell: "On average, finishers are relying on AI more like a search box — asking it things rather than directing real tasks — compared to when they started.",
    flat: "On average, finishers' way of directing AI tools didn't change.",
  },
};

/** Picks the rose/fell/flat sentence for a metric's actual delta direction. */
export function interpretationFor(key: string, deltaPts: number): string | null {
  const d = DOMAIN_DESCRIPTIONS[key];
  if (!d) return null;
  if (deltaPts > 0) return d.rose;
  if (deltaPts < 0) return d.fell;
  return d.flat;
}
