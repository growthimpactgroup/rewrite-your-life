"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  EMAIL_COPY,
  EMAIL_REASSURANCE,
  EMAIL_ERROR,
  EMAIL_CHECK_NONE_FOUND,
  EMAIL_CHECK_DUPLICATE_FIRST,
  EMAIL_CHECK_GO_BACK_LABEL,
  EMAIL_CHECK_CONTINUE_LABEL,
  Phase,
} from "@/lib/questions";
import { isValidEmailFormat } from "@/lib/email";
import BackArrow from "./BackArrow";
import ScreenContainer from "./ScreenContainer";
import FormattedText from "./FormattedText";

type ContinuityWarning = "none-found" | "duplicate-first";

export default function EmailScreen({
  email,
  phase,
  onEmailChange,
  onBack,
  onSubmit,
}: {
  email: string;
  phase: Phase;
  onEmailChange: (value: string) => void;
  onBack: () => void;
  onSubmit: (email: string) => void;
}) {
  // No local copy of the email — it's fully controlled by SurveyFlow and
  // updated on every keystroke (not just on submit), so a typed-but-not-yet-
  // submitted address survives back-then-forward navigation instead of
  // being lost when this component unmounts.
  const [touched, setTouched] = useState(false);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [warning, setWarning] = useState<ContinuityWarning | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Desktop-only autofocus — forcing the keyboard up on mobile hides the
  // reassurance line and the screen fails the "readable in under 4 seconds,
  // no scrolling" rule with the keyboard open. Imperative focus() in an
  // effect (not a controlled `autoFocus` prop) so there's no server/client
  // render mismatch — matchMedia only exists in the browser.
  useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      inputRef.current?.focus();
    }
  }, []);

  const isValid = isValidEmailFormat(email.trim());

  function handleEmailChange(value: string) {
    if (warning) setWarning(null);
    onEmailChange(value);
  }

  // Early continuity check — was previously only discoverable on the
  // results screen, after spending 6 minutes on the questions. A typo'd
  // retake email (nothing found) or a duplicate "first" (already has
  // results) both get caught here instead, before that time is spent.
  // Never blocks: a lookup failure, or the person choosing to proceed
  // anyway, both fall straight through to the normal submit path.
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValid || submitting || checking) return;

    const trimmed = email.trim();
    setChecking(true);
    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course: "ryl", email: trimmed }),
      });
      if (res.ok) {
        const body = await res.json();
        const count = Array.isArray(body?.submissions) ? body.submissions.length : 0;
        if (phase !== "first" && count === 0) {
          setChecking(false);
          setWarning("none-found");
          return;
        }
        if (phase === "first" && count > 0) {
          setChecking(false);
          setWarning("duplicate-first");
          return;
        }
      }
    } catch {
      // Fail open — a network hiccup on the check itself should never
      // block someone from continuing.
    }
    setChecking(false);
    setSubmitting(true);
    onSubmit(trimmed);
  }

  function handleContinueAnyway() {
    setWarning(null);
    setSubmitting(true);
    onSubmit(email.trim());
  }

  return (
    <ScreenContainer>
      <BackArrow onClick={onBack} />
      <form onSubmit={handleSubmit} className="w-full text-center">
        <h1 className="text-[26px] font-semibold tracking-tight text-ink">
          What&apos;s your email?
        </h1>
        {/* Jeff review call, 2026-08-11: enlarged for legibility, bumped again per follow-up. */}
        <p className="mt-2 text-[19px] leading-relaxed text-muted">{EMAIL_COPY}</p>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          aria-label="Email address"
          ref={inputRef}
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="you@example.com"
          className="glass mt-8 w-full min-h-[52px] rounded-2xl px-5 py-4 text-[19px] text-ink outline-none placeholder:text-muted focus:border-secondary/60 focus:ring-2 focus:ring-secondary/30"
        />
        {touched && !isValid && (
          <p className="mt-2 text-[14px] text-red-500 dark:text-red-400">{EMAIL_ERROR}</p>
        )}

        {warning ? (
          <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3.5 text-left dark:border-amber-700 dark:bg-amber-950">
            <p className="text-[14px] leading-relaxed text-amber-800 dark:text-amber-200">
              <FormattedText
                text={warning === "none-found" ? EMAIL_CHECK_NONE_FOUND : EMAIL_CHECK_DUPLICATE_FIRST}
              />
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={onBack}
                className="tap flex-1 rounded-full px-4 py-3 text-[15px] font-medium text-ink glass"
              >
                {EMAIL_CHECK_GO_BACK_LABEL}
              </button>
              <button
                type="button"
                onClick={handleContinueAnyway}
                className="tap flex-1 rounded-full bg-primary px-4 py-3 text-[15px] font-medium text-white"
              >
                {EMAIL_CHECK_CONTINUE_LABEL}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="submit"
            disabled={!isValid || submitting || checking}
            className="tap mt-6 w-full rounded-full bg-primary px-6 py-4 text-[17px] font-medium text-white shadow-[0_1px_2px_rgb(0_0_0/0.1),0_8px_20px_rgb(0_0_0/0.15)] disabled:opacity-35"
          >
            {checking ? "Checking…" : submitting ? "Continuing…" : "Continue"}
          </button>
        )}

        <p className="mt-4 px-1 text-[18px] leading-relaxed text-muted">
          <FormattedText text={EMAIL_REASSURANCE} />
        </p>
      </form>
    </ScreenContainer>
  );
}
