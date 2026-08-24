"use client";

import { useState } from "react";
import {
  CONSENT_TEXT,
  CONSENT_DISCLOSURE,
  DECLINE_OPTION_LABEL,
  DECLINE_CONFIRM_HEADLINE,
  DECLINE_CONFIRM_BODY,
  DECLINE_CONFIRM_ACTION,
  DECLINE_CONFIRM_CANCEL,
} from "@/lib/questions";
import BackArrow from "./BackArrow";
import ScreenContainer from "./ScreenContainer";
import FormattedText from "./FormattedText";

export default function ConsentScreen({
  submitting,
  errorMessage,
  declining,
  declineErrorMessage,
  onBack,
  onSubmit,
  onDecline,
}: {
  submitting: boolean;
  errorMessage: string | null;
  declining: boolean;
  declineErrorMessage: string | null;
  onBack: () => void;
  onSubmit: () => void;
  onDecline: () => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const [confirmingDecline, setConfirmingDecline] = useState(false);

  if (confirmingDecline) {
    return (
      <ScreenContainer>
        <div className="w-full">
          <h1 className="text-[26px] font-semibold tracking-tight text-ink">
            {DECLINE_CONFIRM_HEADLINE}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted">
            <FormattedText text={DECLINE_CONFIRM_BODY} />
          </p>

          {declineErrorMessage && (
            <p className="mt-4 text-[13px] text-red-500 dark:text-red-400">{declineErrorMessage}</p>
          )}

          <button
            type="button"
            onClick={onDecline}
            disabled={declining}
            className="tap mt-8 w-full rounded-full bg-primary px-6 py-4 text-[17px] font-medium text-white shadow-[0_1px_2px_rgb(0_0_0/0.1),0_8px_20px_rgb(0_0_0/0.15)] disabled:opacity-35"
          >
            {declining ? "Discarding…" : DECLINE_CONFIRM_ACTION}
          </button>
          <button
            type="button"
            onClick={() => setConfirmingDecline(false)}
            disabled={declining}
            className="tap mt-3 w-full rounded-full px-6 py-4 text-[15px] font-medium text-muted disabled:opacity-35"
          >
            {DECLINE_CONFIRM_CANCEL}
          </button>
        </div>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <BackArrow onClick={onBack} />
      <div className="w-full">
        <h1 className="text-[26px] font-semibold tracking-tight text-ink">Last step</h1>

        <button
          type="button"
          onClick={() => setAgreed((a) => !a)}
          aria-pressed={agreed}
          className="glass tap mt-8 flex w-full items-center gap-3.5 rounded-2xl px-5 py-4 text-left"
        >
          <span
            aria-hidden
            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[7px] border-2 transition-colors duration-200 ${
              agreed ? "border-accent bg-accent" : "border-border bg-card"
            }`}
          >
            {agreed && (
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
          <span className="text-[16px] leading-relaxed text-ink">{CONSENT_TEXT}</span>
        </button>

        <p className="mt-4 px-1 text-[16px] leading-relaxed text-muted">
          <FormattedText text={CONSENT_DISCLOSURE} />
        </p>

        {errorMessage && <p className="mt-4 text-[13px] text-red-500 dark:text-red-400">{errorMessage}</p>}

        <button
          type="button"
          onClick={onSubmit}
          disabled={!agreed || submitting}
          className="tap mt-6 w-full rounded-full bg-primary px-6 py-4 text-[17px] font-medium text-white shadow-[0_1px_2px_rgb(0_0_0/0.1),0_8px_20px_rgb(0_0_0/0.15)] disabled:opacity-35"
        >
          {submitting ? "Saving…" : "I agree."}
        </button>

        <button
          type="button"
          onClick={() => setConfirmingDecline(true)}
          disabled={submitting}
          className="tap mt-4 w-full text-[13px] font-medium text-muted underline-offset-2 hover:underline disabled:opacity-35"
        >
          {DECLINE_OPTION_LABEL}
        </button>
      </div>
    </ScreenContainer>
  );
}
