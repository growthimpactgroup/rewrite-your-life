"use client";

import { useState } from "react";
import {
  PHASE_OPTIONS,
  Phase,
  ENTRY_HEADLINE,
  ENTRY_SUBTEXT,
  ENTRY_FRAMING_LINE,
  ENTRY_DISCLAIMER,
  ENTRY_EMAIL_NOTICE_RED,
  CONFIRM_DELAY_MS,
} from "@/lib/questions";
import ScreenContainer from "./ScreenContainer";
import RedNotice from "./RedNotice";
import FormattedText from "./FormattedText";

// Screen A build spec: one tap sets the phase and advances, on the same
// tap-confirm-advance beat as the question screens — never instant.
export default function EntryScreen({ onSelect }: { onSelect: (phase: Phase) => void }) {
  const [selected, setSelected] = useState<Phase | null>(null);

  function handleTap(phase: Phase) {
    if (selected !== null) return;
    setSelected(phase);
    window.setTimeout(() => onSelect(phase), CONFIRM_DELAY_MS);
  }

  return (
    <ScreenContainer>
      <h1 className="text-[26px] font-semibold tracking-tight text-ink">{ENTRY_HEADLINE}</h1>
      <p className="mt-1.5 text-[15px] text-muted">{ENTRY_SUBTEXT}</p>

      <div className="mt-6 flex w-full flex-col gap-2">
        {PHASE_OPTIONS.map((opt) => {
          const isSelected = selected === opt.phase;
          const isDimmed = selected !== null && !isSelected;
          return (
            <button
              key={opt.phase}
              type="button"
              onClick={() => handleTap(opt.phase)}
              disabled={selected !== null}
              className={`tap w-full rounded-full px-6 py-3 text-center shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_20px_rgb(0_0_0/0.05)] disabled:active:scale-100 ${
                isSelected ? "bg-secondary/15 ring-1 ring-secondary/50" : "glass"
              }`}
            >
              <span
                className={`block text-[17px] font-medium ${
                  isSelected ? "text-primary" : isDimmed ? "text-muted" : "text-ink"
                }`}
              >
                {opt.label}
              </span>
              <span className="mt-0.5 block text-[12.5px] font-normal text-muted">
                {opt.helper}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-[16px] font-medium text-muted">{ENTRY_FRAMING_LINE}</p>

      <p className="mt-4 border-t border-border pt-4 text-[16px] leading-relaxed text-muted">
        <FormattedText text={ENTRY_DISCLAIMER} />
      </p>

      <div className="mt-3 w-full">
        <RedNotice>{ENTRY_EMAIL_NOTICE_RED}</RedNotice>
      </div>
    </ScreenContainer>
  );
}
