// The private code that replaces email as the matching key: birthday month +
// day (no year) and the first initials of the two people who raised you,
// e.g. 0314-MD. Built from four dropdown taps, never typed.

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

// February allows 29 so a leap-day birthday can still make a code.
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function daysInMonth(month: number): number {
  return DAYS_IN_MONTH[month - 1] ?? 31;
}

// Same shape the database constraint enforces.
const CODE_PATTERN = /^(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])-[A-Z]{2}$/;

export function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidCode(value: string): boolean {
  const code = normalizeCode(value);
  if (!CODE_PATTERN.test(code)) return false;
  const month = Number(code.slice(0, 2));
  const day = Number(code.slice(2, 4));
  return day <= daysInMonth(month);
}

export function buildCode(month: number, day: number, mum: string, dad: string): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${mm}${dd}-${mum}${dad}`;
}
