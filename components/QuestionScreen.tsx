"use client";

import { useState } from "react";
import { Question, optionsFor, CONFIRM_DELAY_MS } from "@/lib/questions";
import BackArrow from "./BackArrow";
import ForwardArrow from "./ForwardArrow";
import ScreenContainer from "./ScreenContainer";

// The parent remounts this fresh per question (key={question.id}), so local
// state naturally resets on navigation. `selected` reflects the answer shown
// (pre-filled from a prior visit, in review mode) so a revisited question
// still shows what was picked. `confirming` is the brief post-tap window
// ONLY — it must never become a permanent "already answered" lock, or
// returning to any answered question disables every button with no way
// forward (the back-navigation bug this file previously had).
export default function QuestionScreen({
  question,
  index,
  total,
  savedValue,
  showBack,
  showForward,
  onBack,
  onForward,
  onAnswer,
}: {
  question: Question;
  index: number; // 0-based
  total: number;
  savedValue: number | null;
  showBack: boolean;
  showForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onAnswer: (value: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(savedValue);
  const [confirming, setConfirming] = useState(false);

  function handleTap(value: number) {
    // Guard the brief confirm beat only — never a permanent lock. Re-tapping
    // the same answer re-confirms it unchanged; tapping a different one
    // overwrites just this index. Either way, advance by one.
    if (confirming) return;
    setSelected(value);
    setConfirming(true);
    window.setTimeout(() => onAnswer(value), CONFIRM_DELAY_MS);
  }

  const options = optionsFor(question.scale);

  return (
    <ScreenContainer>
      {showBack && <BackArrow onClick={onBack} />}
      {showForward && <ForwardArrow onClick={onForward} />}
      <div className="w-full">
        <p className="text-[13px] font-medium tracking-wide text-muted uppercase">
          Question {index + 1} of {total}
        </p>
        <h1 className="mt-3 text-[21px] leading-snug font-semibold tracking-tight text-ink">
          {question.text}
        </h1>
        {question.example && (
          // Enlarged for legibility per Jeff's 2026-08-10 note, but kept
          // under the question's own 21px so the example (supporting text)
          // never visually outweighs the question itself (primary text).
          <p className="mt-2 text-[18px] leading-snug text-muted italic">
            {question.example}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-2.5">
          {options.map((opt) => {
            const isSelected = selected === opt.value;
            const isDimmed = confirming && !isSelected;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleTap(opt.value)}
                disabled={confirming}
                className={`tap flex w-full items-center justify-between rounded-full px-5 py-4 text-left text-[17px] font-medium disabled:active:scale-100 ${
                  isSelected
                    ? "bg-secondary/15 text-primary ring-1 ring-secondary/50"
                    : isDimmed
                      ? "glass text-muted"
                      : "glass text-ink"
                }`}
              >
                <span>
                  <span className="mr-2.5 tabular-nums font-semibold">{opt.value}</span>
                  <span>{opt.label}</span>
                </span>
                {isSelected && (
                  <span
                    aria-hidden
                    className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent text-[11px] text-white"
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </ScreenContainer>
  );
}
