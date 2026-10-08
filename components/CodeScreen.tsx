"use client";

import { FormEvent, useState } from "react";
import {
  CODE_HEADLINE,
  CODE_INTRO,
  CODE_BIRTHDAY_LABEL,
  CODE_MUM_LABEL,
  CODE_DAD_LABEL,
  CODE_RAISED_NOTE,
  CODE_REASSURANCE,
  CODE_CONSENT_TEXT,
  CODE_CHECK_NONE_FOUND,
  CODE_CHECK_DUPLICATE_FIRST,
  CODE_CHECK_GO_BACK_LABEL,
  CODE_CHECK_CONTINUE_LABEL,
  LEGACY_EMAIL_LINK,
  LEGACY_EMAIL_LABEL,
  LEGACY_EMAIL_NOT_FOUND,
  LEGACY_EMAIL_BACK_LINK,
  Phase,
} from "@/lib/questions";
import { MONTH_NAMES, LETTERS, daysInMonth, buildCode } from "@/lib/participantCode";
import { isValidEmailFormat, normalizeEmail } from "@/lib/email";
import BackArrow from "./BackArrow";
import ScreenContainer from "./ScreenContainer";
import FormattedText from "./FormattedText";

export type Identity = { kind: "code"; code: string } | { kind: "email"; email: string };

export interface CodeFormState {
  month: string;
  day: string;
  mum: string;
  dad: string;
  agreed: boolean;
  legacy: boolean;
  email: string;
}

export const EMPTY_CODE_FORM: CodeFormState = {
  month: "",
  day: "",
  mum: "",
  dad: "",
  agreed: false,
  legacy: false,
  email: "",
};

type ContinuityWarning = "none-found" | "duplicate-first";

const SELECT_CLASS =
  "glass min-h-[52px] w-full rounded-2xl px-4 py-3 text-[18px] text-ink outline-none focus:border-secondary/60 focus:ring-2 focus:ring-secondary/30";

export default function CodeScreen({
  form,
  phase,
  onChange,
  onBack,
  onSubmit,
}: {
  form: CodeFormState;
  phase: Phase;
  onChange: (next: CodeFormState) => void;
  onBack: () => void;
  onSubmit: (identity: Identity) => void;
}) {
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [warning, setWarning] = useState<ContinuityWarning | null>(null);
  const [legacyError, setLegacyError] = useState(false);

  const monthNumber = Number(form.month);
  const days = daysInMonth(monthNumber || 1);
  const canOfferLegacy = phase !== "first";

  const identityReady = form.legacy
    ? isValidEmailFormat(form.email.trim())
    : form.month !== "" && form.day !== "" && form.mum !== "" && form.dad !== "";
  const canContinue = identityReady && form.agreed && !checking && !submitting;

  function update(patch: Partial<CodeFormState>) {
    if (warning) setWarning(null);
    if (legacyError) setLegacyError(false);
    onChange({ ...form, ...patch });
  }

  function currentIdentity(): Identity {
    if (form.legacy) return { kind: "email", email: normalizeEmail(form.email) };
    return {
      kind: "code",
      code: buildCode(Number(form.month), Number(form.day), form.mum, form.dad),
    };
  }

  function proceed(identity: Identity) {
    setWarning(null);
    setSubmitting(true);
    onSubmit(identity);
  }

  // Early continuity check, before six minutes of questions are spent. For a
  // private code it only ever warns; for a legacy email it blocks, because
  // that path exists solely to let existing participants finish — it must
  // never be a way to start storing a new email.
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canContinue) return;

    const identity = currentIdentity();
    setChecking(true);
    try {
      const res = await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          identity.kind === "code"
            ? { course: "ryl", code: identity.code }
            : { course: "ryl", email: identity.email },
        ),
      });
      if (res.ok) {
        const body = await res.json();
        const count = Array.isArray(body?.submissions) ? body.submissions.length : 0;
        if (identity.kind === "email" && count === 0) {
          setChecking(false);
          setLegacyError(true);
          return;
        }
        if (identity.kind === "code" && phase !== "first" && count === 0) {
          setChecking(false);
          setWarning("none-found");
          return;
        }
        if (identity.kind === "code" && phase === "first" && count > 0) {
          setChecking(false);
          setWarning("duplicate-first");
          return;
        }
      }
    } catch {
      // Fail open — a network hiccup on the check itself must never block
      // someone from continuing. The submit route enforces the real rules.
    }
    setChecking(false);
    proceed(identity);
  }

  return (
    <ScreenContainer>
      <BackArrow onClick={onBack} />
      <form onSubmit={handleSubmit} className="w-full">
        <h1 className="text-center text-[26px] font-semibold tracking-tight text-ink">
          {form.legacy ? LEGACY_EMAIL_LABEL : CODE_HEADLINE}
        </h1>

        {form.legacy ? (
          <div className="mt-6">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              aria-label={LEGACY_EMAIL_LABEL}
              value={form.email}
              onChange={(e) => update({ email: e.target.value })}
              placeholder="you@example.com"
              className="glass w-full min-h-[52px] rounded-2xl px-5 py-4 text-[19px] text-ink outline-none placeholder:text-muted focus:border-secondary/60 focus:ring-2 focus:ring-secondary/30"
            />
            {legacyError && (
              <p className="mt-2 text-[14px] text-red-500 dark:text-red-400">{LEGACY_EMAIL_NOT_FOUND}</p>
            )}
            <button
              type="button"
              onClick={() => update({ legacy: false, email: "" })}
              className="tap mt-3 w-full text-[14px] font-medium text-muted underline-offset-2 hover:underline"
            >
              {LEGACY_EMAIL_BACK_LINK}
            </button>
          </div>
        ) : (
          <>
            <p className="mt-2 text-center text-[19px] leading-relaxed text-muted">{CODE_INTRO}</p>

            <div className="mt-6 space-y-5 text-left">
              <div>
                <span className="block text-[16px] font-medium text-ink">{CODE_BIRTHDAY_LABEL}</span>
                <div className="mt-2 grid grid-cols-[3fr_2fr] gap-3">
                  <select
                    aria-label="Birthday month"
                    value={form.month}
                    onChange={(e) => {
                      const nextMonth = e.target.value;
                      const maxDay = daysInMonth(Number(nextMonth) || 1);
                      const keepDay = form.day !== "" && Number(form.day) <= maxDay;
                      update({ month: nextMonth, day: keepDay ? form.day : "" });
                    }}
                    className={SELECT_CLASS}
                  >
                    <option value="">Month</option>
                    {MONTH_NAMES.map((name, i) => (
                      <option key={name} value={String(i + 1)}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Birthday day"
                    value={form.day}
                    onChange={(e) => update({ day: e.target.value })}
                    className={SELECT_CLASS}
                  >
                    <option value="">Day</option>
                    {Array.from({ length: days }, (_, i) => (
                      <option key={i + 1} value={String(i + 1)}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="mum-initial" className="block text-[16px] font-medium text-ink">
                  {CODE_MUM_LABEL}
                </label>
                <select
                  id="mum-initial"
                  value={form.mum}
                  onChange={(e) => update({ mum: e.target.value })}
                  className={`${SELECT_CLASS} mt-2`}
                >
                  <option value="">Letter</option>
                  {LETTERS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="dad-initial" className="block text-[16px] font-medium text-ink">
                  {CODE_DAD_LABEL}
                </label>
                <select
                  id="dad-initial"
                  value={form.dad}
                  onChange={(e) => update({ dad: e.target.value })}
                  className={`${SELECT_CLASS} mt-2`}
                >
                  <option value="">Letter</option>
                  {LETTERS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[14px] italic text-muted">{CODE_RAISED_NOTE}</p>
              </div>
            </div>

            <p className="mt-5 text-center text-[16px] font-medium text-muted">{CODE_REASSURANCE}</p>
          </>
        )}

        <div className="glass mt-6 flex w-full items-start gap-3.5 rounded-2xl px-5 py-4 text-left">
          <button
            type="button"
            role="checkbox"
            aria-checked={form.agreed}
            aria-label="I agree"
            onClick={() => update({ agreed: !form.agreed })}
            className="tap mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center"
          >
            <span
              aria-hidden
              className={`flex h-6 w-6 items-center justify-center rounded-[7px] border-2 transition-colors duration-200 ${
                form.agreed ? "border-accent bg-accent" : "border-border bg-card"
              }`}
            >
              {form.agreed && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="white"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          </button>
          <p className="text-[16px] leading-relaxed text-ink">
            {CODE_CONSENT_TEXT}{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap font-medium text-primary underline"
            >
              Privacy →
            </a>
          </p>
        </div>

        {warning ? (
          <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3.5 text-left dark:border-amber-700 dark:bg-amber-950">
            <p className="text-[14px] leading-relaxed text-amber-800 dark:text-amber-200">
              <FormattedText
                text={warning === "none-found" ? CODE_CHECK_NONE_FOUND : CODE_CHECK_DUPLICATE_FIRST}
              />
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={onBack}
                className="tap glass flex-1 rounded-full px-4 py-3 text-[15px] font-medium text-ink"
              >
                {CODE_CHECK_GO_BACK_LABEL}
              </button>
              <button
                type="button"
                onClick={() => proceed(currentIdentity())}
                className="tap flex-1 rounded-full bg-primary px-4 py-3 text-[15px] font-medium text-white"
              >
                {CODE_CHECK_CONTINUE_LABEL}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="submit"
            disabled={!canContinue}
            className="tap mt-6 w-full rounded-full bg-primary px-6 py-4 text-[17px] font-medium text-white shadow-[0_1px_2px_rgb(0_0_0/0.1),0_8px_20px_rgb(0_0_0/0.15)] disabled:opacity-35"
          >
            {checking ? "Checking…" : submitting ? "Continuing…" : "Continue →"}
          </button>
        )}

        {canOfferLegacy && !form.legacy && (
          <button
            type="button"
            onClick={() => update({ legacy: true })}
            className="tap mt-4 w-full text-[13px] font-medium text-muted underline-offset-2 hover:underline"
          >
            {LEGACY_EMAIL_LINK}
          </button>
        )}
      </form>
    </ScreenContainer>
  );
}
