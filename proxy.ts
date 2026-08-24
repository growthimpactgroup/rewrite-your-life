import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Change Order 01, Phase 1 — routes /results?preview=published to the
// internal seeded-preview page, WITHOUT the real /results page ever reading
// searchParams itself. Reading searchParams in a page opts the whole route
// into dynamic (per-request) rendering in this Next version's caching
// model — that would reintroduce a database query on every real visitor's
// page load, contradicting Section 5's "zero database queries on page
// load." Rewriting at the proxy layer keeps the real page fully static and
// gives preview mode its own always-dynamic, DB-free route instead.
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/results") {
    const preview = request.nextUrl.searchParams.get("preview");
    if (preview === "published") {
      return NextResponse.rewrite(new URL("/preview-results-published", request.url));
    }
    if (preview === "withheld") {
      return NextResponse.rewrite(new URL("/preview-results-withheld", request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/results",
};
