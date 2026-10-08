"use client";

import { useEffect, useRef, useState } from "react";
import { QUESTIONS, TOTAL_QUESTIONS, Phase } from "@/lib/questions";
import ProgressBar from "./ProgressBar";
import EntryScreen from "./EntryScreen";
import CodeScreen, { CodeFormState, EMPTY_CODE_FORM, Identity } from "./CodeScreen";
import QuestionsIntroScreen from "./QuestionsIntroScreen";
import QuestionScreen from "./QuestionScreen";
import ResultsReportScreen from "./ResultsReportScreen";
import ScreenContainer from "./ScreenContainer";

type Screen =
  | { name: "entry" }
  | { name: "code" }
  | { name: "questions-intro" }
  | { name: "question"; index: number }
  | { name: "saving" }
  | { name: "done" };

// The browser-history shape pushed while inside the protected flow (question
// 1 through question 27). Kept minimal on purpose — just enough to
// reconstruct position. See the back-navigation bug fix: in-app back/forward
// and browser/OS back/forward must be the exact same code path, or they drift.
type HistoryState = { screen: "question"; index: number };

// code + questions-intro + 27 questions
const PROGRESS_TOTAL_STEPS = 1 + 1 + TOTAL_QUESTIONS;

export default function SurveyFlow() {
  const [screen, setScreen] = useState<Screen>({ name: "entry" });
  const [phase, setPhase] = useState<Phase | null>(null);
  const [codeForm, setCodeForm] = useState<CodeFormState>(EMPTY_CODE_FORM);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(TOTAL_QUESTIONS).fill(null),
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const screenRef = useRef(screen);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  function pushHistory(state: HistoryState) {
    window.history.pushState(state, "", window.location.href);
  }

  // Single source of truth for back/forward inside the protected flow: the
  // in-app arrows call history.back()/forward(), never setScreen directly,
  // so browser back, the in-app arrow, and an iOS swipe-back gesture all run
  // through this one handler and can never drift out of sync.
  useEffect(() => {
    function onPopState(e: PopStateEvent) {
      const state = e.state as HistoryState | null;
      if (state?.screen === "question") {
        setScreen({ name: "question", index: state.index });
      } else if (screenRef.current.name === "question") {
        // Fell off the tracked stack while still logically inside the
        // protected flow (e.g. a swipe-back at question 1, which has no
        // back path). Trap it at question 1 instead of silently exiting.
        pushHistory({ screen: "question", index: 0 });
        setScreen({ name: "question", index: 0 });
      }
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Warn before an accidental tab close / reload loses in-progress answers.
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (screen.name === "question" || screen.name === "saving") {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [screen.name]);

  // Answers are always filled left-to-right with no gaps, so the highest
  // index with a non-null answer is exactly how far the participant has
  // ever reached — the boundary that decides whether the forward arrow (and
  // review mode generally) shows for the currently-viewed question.
  const furthestIndex = answers.reduce<number>(
    (max, a, i) => (a !== null ? i : max),
    -1,
  );

  function progressForScreen(): number | null {
    if (screen.name === "code") return (1 / PROGRESS_TOTAL_STEPS) * 100;
    if (screen.name === "questions-intro") return (2 / PROGRESS_TOTAL_STEPS) * 100;
    if (screen.name === "question") {
      return ((3 + screen.index) / PROGRESS_TOTAL_STEPS) * 100;
    }
    if (screen.name === "saving") return 100;
    return null;
  }

  function handlePhaseSelect(p: Phase) {
    setPhase(p);
    setScreen({ name: "code" });
  }

  function handleCodeSubmit(value: Identity) {
    setIdentity(value);
    setScreen({ name: "questions-intro" });
  }

  function handleBeginQuestions() {
    pushHistory({ screen: "question", index: 0 });
    setScreen({ name: "question", index: 0 });
  }

  function handleAnswer(index: number, value: number) {
    const next = [...answers];
    next[index] = value;
    setAnswers(next);
    if (index + 1 < TOTAL_QUESTIONS) {
      pushHistory({ screen: "question", index: index + 1 });
      setScreen({ name: "question", index: index + 1 });
    } else {
      void handleFinalSubmit(next);
    }
  }

  function handleForward(index: number) {
    // Pure navigation — never touches answers, only moves the pointer.
    const nextIndex = index + 1;
    if (nextIndex < TOTAL_QUESTIONS) {
      pushHistory({ screen: "question", index: nextIndex });
      setScreen({ name: "question", index: nextIndex });
    } else {
      void handleFinalSubmit(answers);
    }
  }

  // The consent box on the code screen is the consent gate, so finishing the
  // last question saves straight away. A failure stays on this screen with a
  // retry — the answers are still in memory and nothing has been lost.
  async function handleFinalSubmit(finalAnswers: (number | null)[]) {
    if (!phase || !identity) return;
    setErrorMessage(null);
    setScreen({ name: "saving" });
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course: "ryl",
          phase,
          ...(identity.kind === "code" ? { code: identity.code } : { email: identity.email }),
          items: finalAnswers,
          consent: true,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Something went wrong. Please try again.");
      }
      setScreen({ name: "done" });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    }
  }

  const progress = progressForScreen();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      {progress !== null && <ProgressBar progress={progress} />}

      {screen.name === "entry" && <EntryScreen onSelect={handlePhaseSelect} />}

      {screen.name === "code" && phase && (
        <CodeScreen
          form={codeForm}
          phase={phase}
          onChange={setCodeForm}
          onBack={() => setScreen({ name: "entry" })}
          onSubmit={handleCodeSubmit}
        />
      )}

      {screen.name === "questions-intro" && phase && (
        <QuestionsIntroScreen
          phase={phase}
          onBack={() => setScreen({ name: "code" })}
          onContinue={handleBeginQuestions}
        />
      )}

      {screen.name === "question" && (
        <QuestionScreen
          key={screen.index}
          question={QUESTIONS[screen.index]}
          index={screen.index}
          total={TOTAL_QUESTIONS}
          savedValue={answers[screen.index]}
          showBack={screen.index > 0}
          showForward={screen.index < furthestIndex}
          onBack={() => window.history.back()}
          onForward={() => handleForward(screen.index)}
          onAnswer={(value) => handleAnswer(screen.index, value)}
        />
      )}

      {screen.name === "saving" && (
        <ScreenContainer>
          <div className="w-full text-center">
            {errorMessage ? (
              <>
                <h1 className="text-[26px] font-semibold tracking-tight text-ink">
                  We couldn&apos;t save your answers
                </h1>
                <p className="mt-3 text-[16px] leading-relaxed text-muted">
                  {errorMessage} Your answers are still here — nothing has been lost.
                </p>
                <button
                  type="button"
                  onClick={() => void handleFinalSubmit(answers)}
                  className="tap mt-6 w-full rounded-full bg-primary px-6 py-4 text-[17px] font-medium text-white shadow-[0_1px_2px_rgb(0_0_0/0.1),0_8px_20px_rgb(0_0_0/0.15)]"
                >
                  Try again
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    pushHistory({ screen: "question", index: TOTAL_QUESTIONS - 1 });
                    setScreen({ name: "question", index: TOTAL_QUESTIONS - 1 });
                  }}
                  className="tap mt-3 w-full text-[14px] font-medium text-muted underline-offset-2 hover:underline"
                >
                  Back to my answers
                </button>
              </>
            ) : (
              <h1 className="text-[26px] font-semibold tracking-tight text-ink">Saving your answers…</h1>
            )}
          </div>
        </ScreenContainer>
      )}

      {screen.name === "done" && phase && identity && (
        <ResultsReportScreen phase={phase} identity={identity} />
      )}
    </div>
  );
}
