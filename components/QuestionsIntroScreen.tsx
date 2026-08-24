"use client";

import {
  QUESTIONS_INTRO_HEADLINE,
  QUESTIONS_INTRO_BODY_LINES,
  QUESTIONS_INTRO_PHASE_CONFIRMATION,
  QUESTIONS_INTRO_CONSENT_LINE,
  QUESTIONS_INTRO_NOTICE_LINE,
  QUESTIONS_INTRO_CLINICAL_DISCLOSURE,
  Phase,
} from "@/lib/questions";
import BackArrow from "./BackArrow";
import ScreenContainer from "./ScreenContainer";
import RedNotice from "./RedNotice";
import FormattedText from "./FormattedText";

export default function QuestionsIntroScreen({
  phase,
  onBack,
  onContinue,
}: {
  phase: Phase;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <ScreenContainer>
      <BackArrow onClick={onBack} />
      <div className="w-full">
        <h1 className="text-[26px] font-semibold tracking-tight text-ink">
          {QUESTIONS_INTRO_HEADLINE}
        </h1>
        {/* Sized to match the app's body-copy tier (same as EmailScreen's
            intro line) — previously 32px, larger than every headline in the
            app, which read as a hierarchy error rather than emphasis. Two
            short lines instead of one dense sentence, so it reads with a
            beat between the hook and the substance rather than all at once. */}
        {QUESTIONS_INTRO_BODY_LINES.map((line, i) => (
          <p
            key={i}
            className={`text-[19px] leading-relaxed text-muted ${i === 0 ? "mt-3" : "mt-2"}`}
          >
            <FormattedText text={line} />
          </p>
        ))}

        <p className="mt-5 border-t border-border pt-4 text-[18px] leading-relaxed text-muted">
          <FormattedText text={QUESTIONS_INTRO_PHASE_CONFIRMATION[phase]} />
        </p>

        <div className="mt-6">
          <RedNotice>{QUESTIONS_INTRO_CLINICAL_DISCLOSURE}</RedNotice>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <p className="text-[16px] leading-relaxed text-muted">
            <FormattedText text={QUESTIONS_INTRO_CONSENT_LINE} />
          </p>
          <p className="text-[16px] leading-relaxed text-muted">
            <FormattedText text={QUESTIONS_INTRO_NOTICE_LINE} />
          </p>
        </div>

        <button
          type="button"
          onClick={onContinue}
          className="tap mt-6 w-full rounded-full bg-primary px-6 py-4 text-[17px] font-medium text-white shadow-[0_1px_2px_rgb(0_0_0/0.1),0_8px_20px_rgb(0_0_0/0.15)]"
        >
          Begin
        </button>
      </div>
    </ScreenContainer>
  );
}
