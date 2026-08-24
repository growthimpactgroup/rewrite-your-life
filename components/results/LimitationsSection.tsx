import { BLOCK_3_NOT_PROFESSIONAL_ADVICE } from "@/lib/copyBlocks";

// Items 1, 3, 4, 5, 6 verbatim from Exhibit E (the original build's five
// items) — never a partial list, never shrunk into a footnote (Section 7:
// "what a skeptical reader's AI quotes back to them, so it is written to
// be quoted"). Item 2 is Change Order 01, Phase 6's Copy Block 3, inserted
// verbatim (Operating Rule 4) — the phase's own GATE requires this exact
// item to be byte-identical to Block 3, so it's rendered with no added
// lead-in phrase of our own, straight from the shared constant.
export default function LimitationsSection({ nExcludedStraightline }: { nExcludedStraightline: number }) {
  const items: { lead: string; body: React.ReactNode }[] = [
    {
      lead: "Self-assessments, not lab measurements.",
      body: "Every figure is a participant rating their own behavior from 0 to 10. That is a real signal and a real limitation.",
    },
    {
      lead: "",
      body: BLOCK_3_NOT_PROFESSIONAL_ADVICE,
    },
    {
      lead: "Self-selected finishers.",
      body: "The change data covers people who completed ten weeks. Non-finishers appear in the funnel above and nowhere else.",
    },
    {
      lead: "No control group.",
      body: "This is a longitudinal program record, not a randomized trial. Some of the change may come from time, attention, or life events rather than the program.",
    },
    {
      lead: "Straight-line answers excluded.",
      body: (
        <>
          Rows where someone tapped the same value across ten or more consecutive items, including a
          reverse-worded one, stay in the raw record but are excluded from these group numbers.
          Excluded to date: <span className="font-bold text-ink">{nExcludedStraightline}</span>.
        </>
      ),
    },
    {
      lead: "Not a guarantee.",
      body: "These are the group outcomes of past participants. They are not a promise, prediction, or guarantee of your results. Individual results vary and depend on participation.",
    },
  ];

  return (
    <section className="border-b border-border px-6 py-10 sm:px-10 sm:py-14">
      <p className="font-mono text-xs font-semibold tracking-widest text-muted uppercase">
        04 · What these numbers are, and are not
      </p>

      <ul className="mt-6 divide-y divide-border">
        {items.map((item, i) => (
          <li key={i} className="flex gap-4 py-5">
            <span className="font-mono text-muted select-none">§</span>
            <p className="text-lg leading-relaxed text-ink/90">
              {item.lead && <span className="font-bold text-ink">{item.lead} </span>}
              {item.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
