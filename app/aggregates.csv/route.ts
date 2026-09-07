// 2026-08-28, Jeff/Frances review call — Item 2: retired, same reasoning
// as app/aggregates.json/route.ts — see that file's comment. Kept as a
// 410 rather than deleted so an existing link or bookmark gets an
// explanation instead of a silent failure.
export const revalidate = false;

export async function GET() {
  const message =
    "status,message\n" +
    `retired,"This endpoint no longer publishes the full dataset. See /verify.json for structured verification data, or /results for the published figures. Full underlying data is available on request, at Growth Impact Group's discretion -- contact growthimpactgroup@protonmail.com."\n`;

  return new Response(message, {
    status: 410,
    headers: { "Content-Type": "text/csv; charset=utf-8" },
  });
}
