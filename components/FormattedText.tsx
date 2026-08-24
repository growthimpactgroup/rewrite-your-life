// Lightweight **bold** marker parser for copy strings — lets copy in
// lib/questions.ts and lib/resultsCopy.ts stay plain, editable text (no
// JSX, so non-developers can still edit it) while allowing selective
// emphasis on the one phrase that matters in a paragraph. Deliberately
// minimal: only **bold**, not a full markdown parser.
//
// Weight only, no forced color — the copy this renders shows up inside
// paragraphs with very different base colors (muted gray, ink/85, amber
// warning text). Forcing one color would clash in at least one of those;
// font-semibold alone still reads as clear emphasis in any of them.
export default function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}
