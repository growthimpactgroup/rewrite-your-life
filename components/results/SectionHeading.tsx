// 2026-08-26, at Frances's request: every section on these pages had a
// small uppercase "eyebrow" label (e.g. "01 · The whole funnel") acting as
// its only heading, while the body paragraph right beneath it was visibly
// bigger (text-lg vs. the eyebrow's text-xs) — backwards hierarchy. This
// adds the actual heading that was missing, between the eyebrow (kept,
// since a small kicker above a big heading is a normal, correct pattern)
// and the body lede.
export default function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <>
      <p className="font-mono text-xs font-semibold tracking-widest text-muted uppercase">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">{title}</h2>
    </>
  );
}
