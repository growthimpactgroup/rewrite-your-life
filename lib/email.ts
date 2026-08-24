// Shared email handling — used by the client (EmailScreen) and every server
// route that touches an email (submit, results). Keeping normalization in
// one place matters: if submit and results ever normalized differently,
// retake/week10 matching would silently break.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_RE.test(email);
}

/** Trim, lowercase, and strip Gmail-style "+tag" sub-addressing from the
 * local part. Without this, "jane+first@gmail.com" and
 * "jane+retake@gmail.com" are treated as two different people even though
 * they're the same inbox — a real way someone's own retake silently stops
 * matching their first attempt. */
export function normalizeEmail(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at === -1) return trimmed;
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at);
  const plus = local.indexOf("+");
  const cleanLocal = plus === -1 ? local : local.slice(0, plus);
  return cleanLocal + domain;
}
