"use client";

import { useEffect, useRef, useState } from "react";
import { QUESTIONS, TOTAL_QUESTIONS, Phase } from "@/lib/questions";
import ProgressBar from "./ProgressBar";
import EntryScreen from "./EntryScreen";
import EmailScreen from "./EmailScreen";
import QuestionsIntroScreen from "./QuestionsIntroScreen";
import QuestionScreen from "./QuestionScreen";
import ConsentScreen from "./ConsentScreen";
import ResultsReportScreen from "./ResultsReportScreen";

type Screen =
  | { name: "entry" }
  | { name: "email" }
  | { name: "questions-intro" }
  | { name: "question"; index: number }
  | { name: "consent" }
  | { name: "done" };

// The browser-history shape pushed while inside the protected flow (question
// 1 through consent). Kept minimal on purpose — just enough to reconstruct
// position. See the back-navigation bug fix: in-app back/forward and
// browser/OS back/forward must be the exact same code path, or they drift.
type HistoryState = { screen: "question"; index: number } | { screen: "consent" };

// email + questions-intro + 27 questions + consent
const PROGRESS_TOTAL_STEPS = 1 + 1 + TOTAL_QUESTIONS + 1;

export default function SurveyFlow() {
  const [screen, setScreen] = useState<Screen>({ name: "entry" });
  const [phase, setPhase] = useState<Phase | null>(null);
  const [email, setEmail] = useState("");
  const [answers, setAnswers] = useState<(number | null)[]>(
    Array(TOTAL_QUESTIONS).fill(null),
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [declining, setDeclining] = useState(false);
  const [declineError, setDeclineError] = useState<string | null>(null);
  const [declined, setDeclined] = useState(false);

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
      } else if (state?.screen === "consent") {
        setScreen({ name: "consent" });
      } else if (
        screenRef.current.name === "question" ||
        screenRef.current.name === "consent"
      ) {
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
      if (screen.name === "question" || screen.name === "consent") {
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
    if (screen.name === "email") return (1 / PROGRESS_TOTAL_STEPS) * 100;
    if (screen.name === "questions-intro") return (2 / PROGRESS_TOTAL_STEPS) * 100;
    if (screen.name === "question") {
      return ((3 + screen.index) / PROGRESS_TOTAL_STEPS) * 100;
    }
    if (screen.name === "consent") return 100;
    return null;
  }

  function handlePhaseSelect(p: Phase) {
    setPhase(p);
    setScreen({ name: "email" });
  }

  function handleEmailSubmit(value: string) {
    setEmail(value);
    setScreen({ name: "questions-intro" });
  }

  function handleBeginQuestions() {
    pushHistory({ screen: "question", index: 0 });
    setScreen({ name: "question", index: 0 });
  }

  function handleAnswer(index: number, value: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (index + 1 < TOTAL_QUESTIONS) {
      pushHistory({ screen: "question", index: index + 1 });
      setScreen({ name: "question", index: index + 1 });
    } else {
      pushHistory({ screen: "consent" });
      setScreen({ name: "consent" });
    }
  }

  function handleForward(index: number) {
    // Pure navigation — never touches answers, only moves the pointer.
    const nextIndex = index + 1;
    if (nextIndex < TOTAL_QUESTIONS) {
      pushHistory({ screen: "question", index: nextIndex });
      setScreen({ name: "question", index: nextIndex });
    } else {
      pushHistory({ screen: "consent" });
      setScreen({ name: "consent" });
    }
  }

  async function handleFinalSubmit() {
    if (!phase) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course: "ryl",
          phase,
          email,
          items: answers,
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
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecline() {
    if (!phase) return;
    setDeclining(true);
    setDeclineError(null);
    try {
      const res = await fetch("/api/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course: "ryl", phase }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Something went wrong. Please try again.");
      }
      // Formal decline (Section 6): no row written to assessment_responses,
      // only a bare tally to decline_log. Email cleared from session state —
      // the results screen below renders straight from the in-memory
      // answers already on hand, no server lookup involved.
      setEmail("");
      setDeclined(true);
      setScreen({ name: "done" });
    } catch (err) {
      setDeclineError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setDeclining(false);
    }
  }

  const progress = progressForScreen();

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      {progress !== null && <ProgressBar progress={progress} />}

      {screen.name === "entry" && <EntryScreen onSelect={handlePhaseSelect} />}

      {screen.name === "email" && phase && (
        <EmailScreen
          email={email}
          phase={phase}
          onEmailChange={setEmail}
          onBack={() => setScreen({ name: "entry" })}
          onSubmit={handleEmailSubmit}
        />
      )}

      {screen.name === "questions-intro" && phase && (
        <QuestionsIntroScreen
          phase={phase}
          onBack={() => setScreen({ name: "email" })}
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

      {screen.name === "consent" && (
        <ConsentScreen
          submitting={submitting}
          errorMessage={errorMessage}
          declining={declining}
          declineErrorMessage={declineError}
          onBack={() => window.history.back()}
          onSubmit={handleFinalSubmit}
          onDecline={handleDecline}
        />
      )}

      {screen.name === "done" && phase && (
        <ResultsReportScreen
          phase={phase}
          email={email}
          declined={declined}
          answers={answers}
        />
      )}
    </div>
  );
}
