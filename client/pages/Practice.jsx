import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle, XCircle, Lightbulb, RotateCcw } from "lucide-react";
import Layout from "@/components/Layout.jsx";
import { renderTextWithMath } from "@/lib/math-rendering.jsx";
import { deleteLocalRecord, readLocalRecord, writeLocalRecord } from "@/lib/local-persistence.js";
import { TEST_SUBJECTS, TOPIC_OPTIONS, SUPPORTED_FALLBACK_TESTS } from "@/data/practice-catalog.js";
import { getFallbackQuestions } from "@/lib/fallback-question-bank.js";

const PRACTICE_SESSION_KEY = "active-practice-session";

function calculatePracticeScore(questions, selectedAnswers) {
  if (!questions.length) return 0;
  let correct = 0;
  questions.forEach((question, index) => {
    const correctIndex = Number.isInteger(question.answerIndex)
      ? question.answerIndex
      : ({ A: 0, B: 1, C: 2, D: 3 }[question.answer?.toUpperCase()] ?? 0);
    if (selectedAnswers[index] === correctIndex) correct += 1;
  });
  return Math.round((correct / questions.length) * 100);
}

function restorePracticeSession(value) {
  if (!value || !Array.isArray(value.questions) || value.questions.length === 0) return null;
  const validQuestions = value.questions.every((question) =>
    question && typeof question.question === "string" &&
    Array.isArray(question.choices) && question.choices.length === 4 &&
    question.choices.every((choice) => typeof choice === "string")
  );
  if (!validQuestions) return null;

  const questions = value.questions;
  const selectedAnswers = Object.fromEntries(
    Object.entries(value.selectedAnswers && typeof value.selectedAnswers === "object" ? value.selectedAnswers : {})
      .filter(([questionIndex, answerIndex]) => {
        const qIndex = Number(questionIndex);
        return Number.isInteger(qIndex) && qIndex >= 0 && qIndex < questions.length &&
          Number.isInteger(answerIndex) && answerIndex >= 0 && answerIndex < questions[qIndex].choices.length;
      })
  );
  const showResults = Boolean(value.showResults);
  const calculatedScore = calculatePracticeScore(questions, selectedAnswers);

  return {
    testType: typeof value.testType === "string" ? value.testType : "",
    subject: typeof value.subject === "string" ? value.subject : "",
    topic: typeof value.topic === "string" ? value.topic : "",
    numQuestions: ["5", "10", "15"].includes(String(value.numQuestions)) ? String(value.numQuestions) : String(questions.length),
    questions,
    currentQuestion: Number.isInteger(value.currentQuestion)
      ? Math.max(0, Math.min(questions.length - 1, value.currentQuestion))
      : 0,
    selectedAnswers,
    showResults,
    questionSource: value.questionSource === "fallback" ? "fallback" : "ai",
    score: showResults && Number.isFinite(value.score) ? value.score : showResults ? calculatedScore : null,
  };
}

/* ---------- Page ---------- */

export default function Practice() {
  const [testType, setTestType] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState("5"); // 5, 10, or 15 only

  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(null);
  const [questionSource, setQuestionSource] = useState("ai");
  const [isPracticeReady, setIsPracticeReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingExplanationIndex, setGeneratingExplanationIndex] = useState(null);
  const [explanationErrors, setExplanationErrors] = useState({});
  const [showIncompleteSubmitConfirmation, setShowIncompleteSubmitConfirmation] = useState(false);
  const cancelIncompleteSubmitRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!showIncompleteSubmitConfirmation) return undefined;
    const previouslyFocused = document.activeElement;
    cancelIncompleteSubmitRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setShowIncompleteSubmitConfirmation(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [showIncompleteSubmitConfirmation]);

  useEffect(() => {
    let isActive = true;
    readLocalRecord(PRACTICE_SESSION_KEY).then((savedSession) => {
      if (!isActive) return;
      const restored = restorePracticeSession(savedSession);
      if (!restored) return;
      setTestType(restored.testType);
      setSubject(restored.subject);
      setTopic(restored.topic);
      setNumQuestions(restored.numQuestions);
      setQuestions(restored.questions);
      setCurrentQuestion(restored.currentQuestion);
      setSelectedAnswers(restored.selectedAnswers);
      setShowResults(restored.showResults);
      setQuestionSource(restored.questionSource);
      setScore(restored.score);
    }).finally(() => {
      if (isActive) setIsPracticeReady(true);
    });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isPracticeReady) return;
    if (questions.length === 0) {
      void deleteLocalRecord(PRACTICE_SESSION_KEY);
      return;
    }
    void writeLocalRecord(PRACTICE_SESSION_KEY, {
      version: 1,
      testType,
      subject,
      topic,
      numQuestions,
      questions,
      currentQuestion,
      selectedAnswers,
      showResults,
      questionSource,
      score: showResults ? (score ?? calculatePracticeScore(questions, selectedAnswers)) : null,
    });
  }, [isPracticeReady, testType, subject, topic, numQuestions, questions, currentQuestion, selectedAnswers, showResults, questionSource, score]);

  const availableSubjects = testType ? TEST_SUBJECTS[testType] || [] : [];
  const availableTopics = subject ? TOPIC_OPTIONS[subject] || [] : [];

  const suggestTopics = () => {
    if (subject && availableTopics.length > 0) {
      const r = availableTopics[Math.floor(Math.random() * availableTopics.length)];
      setTopic(r);
    }
  };

  async function generateQuestions() {
    if (!isPracticeReady || !testType || !subject) return;
    setIsGenerating(true);
    setError("");

    const safeNum = Math.min(15, Math.max(1, parseInt(numQuestions, 10) || 5));
    let normalized = [];
    let source = "ai";

    try {
      let apiError = null;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);
      try {
        const response = await fetch("/api/generate-questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ testType, subject, topic: topic || "General", numQuestions: safeNum }),
          signal: controller.signal,
        });

        if (!response.ok) {
          let message = "Question generation is temporarily unavailable.";
          try { message = (await response.json())?.error || message; } catch {}
          throw new Error(message);
        }

        const data = await response.json();
        const letterToIndex = { A: 0, B: 1, C: 2, D: 3 };
        normalized = (data?.questions || []).map((question) => {
          const answerIndex = Number.isInteger(question?.answerIndex)
            ? question.answerIndex
            : Number.isInteger(question?.correctIndex)
            ? question.correctIndex
            : letterToIndex[(question?.answer || "").toUpperCase()] ?? 0;
          return { ...question, answerIndex, correctIndex: answerIndex, choices: question?.choices || [] };
        });

        const completeSet = normalized.length >= safeNum && normalized.every((question) =>
          typeof question?.question === "string" && question.question.trim() &&
          Array.isArray(question.choices) && question.choices.length === 4 &&
          question.choices.every((choice) => typeof choice === "string") &&
          Number.isInteger(question.answerIndex) && question.answerIndex >= 0 && question.answerIndex < 4
        );
        if (!completeSet) throw new Error("The question generator returned an incomplete set.");
        normalized = normalized.slice(0, safeNum);
      } catch (requestError) {
        apiError = requestError;
      } finally {
        clearTimeout(timeoutId);
      }

      if (apiError) {
        console.warn("Question generation failed; trying the local question bank.", apiError);
        if (!SUPPORTED_FALLBACK_TESTS.has(testType)) {
          const message = apiError.name === "AbortError"
            ? "AI is taking a while. Try again or reduce the number of questions."
            : apiError.message === "Failed to fetch"
            ? "Network error. Please check your connection and try again."
            : apiError.message || "Question generation failed. Please try again.";
          setError(message);
          return;
        }

        try {
          normalized = await getFallbackQuestions({ testType, subject, topic: topic || "General", count: safeNum });
          source = "fallback";
        } catch (fallbackError) {
          console.error("The local question bank could not be loaded:", fallbackError);
          setError("Question generation is unavailable. Check your connection and try again.");
          return;
        }
      }

      setQuestions(normalized);
      setQuestionSource(source);
      setCurrentQuestion(0);
      setSelectedAnswers({});
      setShowResults(false);
      setScore(null);
      setError("");
    } catch (generationError) {
      console.error("Error building questions:", generationError);
      setError("Could not build a practice set. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function generateMoreExplanation(question, questionIndex) {
    if (question.moreExplanation || generatingExplanationIndex !== null) return;
    if (question.source === "fallback" && question.extendedExplanation) {
      setExplanationErrors((previous) => ({ ...previous, [questionIndex]: "" }));
      setQuestions((previous) => previous.map((item, index) =>
        index === questionIndex ? { ...item, moreExplanation: question.extendedExplanation } : item
      ));
      return;
    }
    setGeneratingExplanationIndex(questionIndex);
    setExplanationErrors((previous) => ({ ...previous, [questionIndex]: "" }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    try {
      const answerIndex = Number.isInteger(question.answerIndex)
        ? question.answerIndex
        : ({ A: 0, B: 1, C: 2, D: 3 }[question.answer?.toUpperCase()] ?? 0);
      const answer = ["A", "B", "C", "D"][answerIndex];
      const response = await fetch("/api/expand-explanation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testType,
          subject,
          topic: topic || "General",
          question: question.question,
          choices: question.choices,
          answer,
          answerIndex,
          explanation: question.explanation,
        }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not generate a longer explanation.");
      if (typeof data.explanation !== "string" || !data.explanation.trim()) {
        throw new Error("The longer explanation was empty. Please try again.");
      }
      setQuestions((previous) => previous.map((item, index) =>
        index === questionIndex ? { ...item, moreExplanation: data.explanation.trim() } : item
      ));
    } catch (requestError) {
      const message = requestError.name === "AbortError"
        ? "This explanation is taking too long. Please try again."
        : requestError.message === "Failed to fetch"
        ? "Network error. Please check your connection and try again."
        : requestError.message || "Could not generate a longer explanation. Please try again.";
      setExplanationErrors((previous) => ({ ...previous, [questionIndex]: message }));
    } finally {
      clearTimeout(timeoutId);
      setGeneratingExplanationIndex(null);
    }
  }

  const selectAnswer = (qIdx, aIdx) => {
    if (!isPracticeReady || showResults) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: aIdx }));
    setScore(null);
  };

  const submitAnswers = () => {
    if (!isPracticeReady) return;
    const unansweredCount = questions.filter((_question, index) => !Number.isInteger(selectedAnswers[index])).length;
    if (unansweredCount > 0) {
      setShowIncompleteSubmitConfirmation(true);
      return;
    }
    finishSubmittingAnswers();
  };

  const finishSubmittingAnswers = () => {
    setScore(calculatePracticeScore(questions, selectedAnswers));
    setShowResults(true);
    setShowIncompleteSubmitConfirmation(false);
  };

  const resetQuiz = () => {
    setQuestions([]);
    setQuestionSource("ai");
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setScore(null);
    setError("");
  };

  const calculateScore = () => score ?? calculatePracticeScore(questions, selectedAnswers);
  const answeredCount = questions.filter((_question, index) => Number.isInteger(selectedAnswers[index])).length;
  const unansweredCount = questions.length - answeredCount;
  const activeTopic = topic || questions[currentQuestion]?.topic || "";

  return (
    <Layout>
      <div className="relative isolate min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8 dark:from-black dark:via-black dark:to-emerald-950/30">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 top-16 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-400/10" />
          <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-lime-300/20 blur-3xl dark:bg-lime-400/5" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          {questions.length === 0 && (
            <div className="mb-4">
              <h1 className="text-2xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-3xl">
                Build Your Practice Set
              </h1>
            </div>
          )}

          {questions.length === 0 ? (
            <div className="space-y-5">
              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.03] sm:p-8">
                <div className="space-y-8">
                  <section>
                    <div className="mb-3 flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300">1</span>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Choose an exam</h3>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {["SAT", "ACT", "AP Exams"].map((exam) => {
                        const isSelected = testType === exam;
                        const subtitle = exam === "SAT" ? "College admission" : exam === "ACT" ? "College admission" : "Advanced Placement";
                        return (
                          <button
                            key={exam}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => {
                              setTestType(exam);
                              setSubject("");
                              setTopic("");
                            }}
                            className={isSelected
                              ? "rounded-2xl border-2 border-emerald-600 bg-emerald-50 p-4 text-left shadow-sm dark:border-emerald-400 dark:bg-emerald-400/10"
                              : "rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-emerald-500 hover:bg-emerald-50/60 dark:border-white/15 dark:bg-white/[0.02] dark:hover:border-emerald-400 dark:hover:bg-emerald-400/5"}
                          >
                            <span className="block font-semibold text-gray-950 dark:text-white">{exam}</span>
                            <span className="mt-1 block text-sm text-gray-500 dark:text-white/55">{subtitle}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  <div className="grid gap-7 md:grid-cols-2">
                    <section>
                      <div className="mb-3 flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300">2</span>
                        <h3 className="font-semibold text-gray-900 dark:text-white">Choose a subject</h3>
                      </div>
                      <Select
                        value={subject}
                        onValueChange={(value) => {
                          setSubject(value);
                          setTopic("");
                        }}
                        disabled={!testType}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white dark:border-white/20 dark:bg-black dark:text-white">
                          <SelectValue placeholder={testType ? "Select a subject" : "Choose an exam first"} />
                        </SelectTrigger>
                        <SelectContent className="max-h-80 dark:border-white/20 dark:bg-[#101510]">
                          {availableSubjects.map((subj) => (
                            <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </section>

                    <section>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300">3</span>
                          <h3 className="font-semibold text-gray-900 dark:text-white">Choose a topic</h3>
                          <span className="text-xs text-gray-500 dark:text-white/50">Optional</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={suggestTopics}
                          disabled={availableTopics.length === 0}
                          className="px-2 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-400/10"
                        >
                          <Lightbulb className="mr-1 h-4 w-4" aria-hidden="true" />
                          Surprise me
                        </Button>
                      </div>
                      {availableTopics.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {availableTopics.map((topicOption) => {
                            const isSelected = topic === topicOption;
                            return (
                              <button
                                key={topicOption}
                                type="button"
                                aria-pressed={isSelected}
                                onClick={() => setTopic(isSelected ? "" : topicOption)}
                                className={isSelected
                                  ? "rounded-full border border-emerald-700 bg-emerald-700 px-3.5 py-2 text-sm font-medium text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-black"
                                  : "rounded-full border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-700 transition hover:border-emerald-500 hover:text-emerald-800 dark:border-white/15 dark:bg-white/[0.02] dark:text-white/75 dark:hover:border-emerald-400"}
                              >
                                {topicOption}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 dark:border-white/20 dark:text-white/50">
                          Choose a subject to see topic options.
                        </p>
                      )}
                    </section>
                  </div>

                  <section>
                    <div className="mb-3 flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300">4</span>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Set length</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {["5", "10", "15"].map((length) => {
                        const isSelected = numQuestions === length;
                        return (
                          <button
                            key={length}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => setNumQuestions(length)}
                            className={isSelected
                              ? "rounded-2xl border-2 border-emerald-600 bg-emerald-50 px-4 py-3 text-center font-semibold text-emerald-900 dark:border-emerald-400 dark:bg-emerald-400/10 dark:text-emerald-200"
                              : "rounded-2xl border border-gray-200 bg-white px-4 py-3 text-center font-semibold text-gray-700 transition hover:border-emerald-500 dark:border-white/15 dark:bg-white/[0.02] dark:text-white/75 dark:hover:border-emerald-400"}
                          >
                            {length} questions
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-sm text-gray-500 dark:text-white/50">A shorter set is a good way to start.</p>
                  </section>
                </div>

                <div className="mt-8 flex flex-col gap-4 rounded-2xl bg-gray-50 p-4 dark:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-white/50">Your practice session</p>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                      {testType || "Choose an exam"}
                      {subject ? " · " + subject : ""}
                      {topic ? " · " + topic : ""}
                      {testType && subject ? " · " + numQuestions + " questions" : ""}
                    </p>
                    {!(testType && subject) && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-white/55">
                        Choose an exam and subject to get started.
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={generateQuestions}
                    disabled={!isPracticeReady || !testType || !subject || isGenerating}
                    className="min-h-12 rounded-full bg-emerald-700 px-6 text-white hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
                  >
                    {isGenerating ? "Building your set..." : "Generate Practice Test"}
                    {!isGenerating && <BookOpen className="ml-2 h-4 w-4" aria-hidden="true" />}
                  </Button>
                </div>

                {error && (
                  <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                    {error}
                  </div>
                )}
                {isGenerating && (
                  <div className="mt-5 flex items-center justify-center gap-3 rounded-xl bg-emerald-50 py-4 text-sm font-medium text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-200" role="status" aria-live="polite">
                    <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    Building a practice set for you…
                  </div>
                )}
              </section>
            </div>
          ) : (
            /* Quiz Interface */
            <div className="space-y-6">
              {!showResults ? (
                <section className="rounded-[1.75rem] bg-white p-4 shadow-2xl shadow-emerald-950/[0.08] dark:bg-[#0b110d] sm:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-800 dark:text-white/80 sm:text-sm">
                      Practice Session
                    </p>
                    <span className="inline-flex shrink-0 items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-gray-600 dark:text-white/65 sm:text-xs">
                      <span className="h-2 w-2 rounded-full bg-emerald-600 ring-4 ring-emerald-100 dark:bg-emerald-400 dark:ring-emerald-400/15" />
                      In Progress
                    </span>
                  </div>

                  <div
                    className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10"
                    role="progressbar"
                    aria-label="Practice session progress"
                    aria-valuemin={0}
                    aria-valuemax={questions.length}
                    aria-valuenow={currentQuestion + 1}
                    aria-valuetext={`${currentQuestion + 1} of ${questions.length} questions`}
                  >
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-[width] duration-300 motion-reduce:transition-none dark:bg-emerald-400"
                      style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                    />
                  </div>

                  <div className="mt-6 rounded-2xl bg-gray-50 p-4 dark:bg-white/[0.04] sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.13em] text-gray-500 dark:text-white/50 sm:text-xs">
                        {subject}
                        <span className="px-1 text-emerald-700 dark:text-emerald-400">·</span>
                        Question {currentQuestion + 1}
                        {activeTopic && <><span className="px-1 text-emerald-700 dark:text-emerald-400">·</span>{activeTopic}</>}
                      </p>
                      <Badge variant="outline" className="shrink-0 border-gray-300 text-gray-600 dark:border-white/20 dark:text-white/65">
                        {questions[currentQuestion]?.difficulty || "Medium"}
                      </Badge>
                    </div>

                    <div id="active-practice-question" role="heading" aria-level={2} className="mt-3 text-lg font-semibold leading-7 text-gray-950 dark:text-white sm:text-2xl sm:leading-9">
                      {renderTextWithMath(questions[currentQuestion]?.question)}
                    </div>

                    <div className="mt-5 space-y-2.5" role="group" aria-labelledby="active-practice-question">
                      {questions[currentQuestion]?.choices.map((choice, index) => {
                        const isSelected = selectedAnswers[currentQuestion] === index;
                        const letter = String.fromCharCode(65 + index);

                        return (
                          <button
                            key={index}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => selectAnswer(currentQuestion, index)}
                            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:focus-visible:ring-emerald-400 dark:focus-visible:ring-offset-black ${isSelected
                              ? "border-emerald-600/80 bg-emerald-50 text-gray-950 shadow-sm dark:border-emerald-400/80 dark:bg-emerald-400/10 dark:text-white"
                              : "border-gray-200/70 bg-white/80 text-gray-700 hover:border-emerald-500/70 dark:border-white/10 dark:bg-white/[0.02] dark:text-white/75 dark:hover:border-emerald-400/60"
                            }`}
                          >
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${isSelected
                              ? "bg-emerald-700 text-white dark:bg-emerald-400 dark:text-black"
                              : "border border-gray-300/80 text-gray-700 dark:border-white/20 dark:text-white/75"
                            }`}>
                              {letter}
                            </span>
                            <span className={`min-w-0 flex-1 ${isSelected ? "font-semibold" : ""}`}>
                              {renderTextWithMath(choice, { inferStandaloneMath: true })}
                            </span>
                            {isSelected && (
                              <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                <CheckCircle className="h-4 w-4" aria-hidden="true" />
                                <span className="hidden sm:inline">Selected</span>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs font-medium text-gray-500 dark:text-white/50">
                      {currentQuestion + 1} of {questions.length} questions
                    </span>
                    <div className="flex w-full justify-between gap-2 sm:w-auto sm:justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                        disabled={currentQuestion === 0}
                        className="min-h-10 rounded-full border-gray-300 bg-white px-5 text-gray-800 dark:border-white/20 dark:bg-white/[0.03] dark:text-white"
                      >
                        Previous
                      </Button>

                      {currentQuestion === questions.length - 1 ? (
                        <Button
                          onClick={submitAnswers}
                          className="min-h-10 rounded-full bg-emerald-700 px-5 text-white hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
                        >
                          Submit Answers
                        </Button>
                      ) : (
                        <Button
                          onClick={() =>
                            setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))
                          }
                          className="min-h-10 rounded-full bg-emerald-700 px-5 text-white hover:bg-emerald-800 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
                        >
                          Next
                        </Button>
                      )}
                    </div>
                  </div>
                </section>
              ) : (
                /* Results */
                <div className="space-y-6">
                  <Card className="bg-white dark:bg-black border dark:border-white/20">
                    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-1 text-center sm:text-left">
                        <CardTitle className="text-gray-900 dark:text-white">
                          Quiz Complete! Your Score: {calculateScore()}%
                        </CardTitle>
                        <p className="text-sm text-gray-600 dark:text-white/65">
                          {answeredCount} of {questions.length} questions answered.
                          {unansweredCount > 0 && " Unanswered questions counted as incorrect."}
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={resetQuiz}
                        className="w-full rounded-full bg-emerald-700 px-5 text-white hover:bg-emerald-800 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300 sm:w-auto"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                        Take Another Practice Set
                      </Button>
                    </CardHeader>
                  </Card>

                  {questions.map((q, qIndex) => {
                    const correctIdx = Number.isInteger(q.answerIndex)
                      ? q.answerIndex
                      : ({ A: 0, B: 1, C: 2, D: 3 }[q.answer?.toUpperCase()] ?? 0);

                    return (
                      <Card key={qIndex} className="bg-white dark:bg-black border dark:border-white/20">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              Question {qIndex + 1}
                            </h3>
                            {!Number.isInteger(selectedAnswers[qIndex]) ? (
                              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 dark:bg-white/10 dark:text-white/70">
                                Not answered
                              </span>
                            ) : selectedAnswers[qIndex] === correctIdx ? (
                              <CheckCircle className="w-6 h-6 text-green-500" />
                            ) : (
                              <XCircle className="w-6 h-6 text-red-500" />
                            )}
                          </div>

                          <div className="text-gray-900 dark:text-white mb-4">
                            {renderTextWithMath(q.question)}
                          </div>

                          <div className="space-y-2 mb-4">
                            {q.choices.map((choice, cIndex) => (
                              <div
                                key={cIndex}
                                className={`p-3 rounded-lg border ${
                                  cIndex === correctIdx
                                    ? "border-green-500 bg-green-50 dark:bg-green-500/10"
                                    : selectedAnswers[qIndex] === cIndex
                                    ? "border-red-500 bg-red-50 dark:bg-red-500/10"
                                    : "border-gray-200 dark:border-white/20"
                                }`}
                              >
                                <span className="font-medium">
                                  {String.fromCharCode(65 + cIndex)}.
                                </span>
                                <span className="ml-2 text-gray-900 dark:text-white">
                                  {renderTextWithMath(choice, { inferStandaloneMath: true })}
                                </span>
                              </div>
                            ))}
                          </div>

                         <div className="explanation-box">
                           <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                             <h4 className="font-semibold">Explanation:</h4>
                             {!q.moreExplanation && (
                               <Button
                                 type="button"
                                 variant="outline"
                                 size="sm"
                                 onClick={() => generateMoreExplanation(q, qIndex)}
                                 disabled={generatingExplanationIndex !== null}
                                 className="h-8 rounded-full border-emerald-700/25 px-3 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-300/25 dark:text-emerald-200 dark:hover:bg-emerald-400/10"
                               >
                                 <Lightbulb className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                                 {generatingExplanationIndex === qIndex ? "Generating…" : "More explanation"}
                               </Button>
                             )}
                           </div>
                            <div>{renderTextWithMath(q.explanation)}</div>
                            {q.moreExplanation && (
                              <div className="mt-4 pt-4">
                                <p className="mb-2 font-semibold">More detail:</p>
                                <div>{renderTextWithMath(q.moreExplanation)}</div>
                              </div>
                            )}
                            {explanationErrors[qIndex] && (
                              <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
                                {explanationErrors[qIndex]}
                              </p>
                            )}
                         </div>

                        </CardContent>
                      </Card>
                    );
                  })}

                  <div className="flex justify-center">
                    <Button
                      type="button"
                      onClick={resetQuiz}
                      className="rounded-full bg-emerald-700 px-5 text-white hover:bg-emerald-800 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                      Take Another Practice Set
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {showIncompleteSubmitConfirmation && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/45 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowIncompleteSubmitConfirmation(false);
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="incomplete-submit-title"
            aria-describedby="incomplete-submit-description"
            className="w-full max-w-md rounded-3xl border border-emerald-100 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-gray-950 sm:p-7"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 id="incomplete-submit-title" className="text-xl font-bold text-gray-950 dark:text-white">
              Submit your practice set?
            </h2>
            <p id="incomplete-submit-description" className="mt-2 leading-6 text-gray-600 dark:text-white/70">
              You left {unansweredCount} {unansweredCount === 1 ? "question" : "questions"} unanswered. If you submit now, they’ll count as incorrect.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                ref={cancelIncompleteSubmitRef}
                type="button"
                variant="outline"
                onClick={() => setShowIncompleteSubmitConfirmation(false)}
                className="rounded-full border-gray-300 bg-white px-5 text-gray-800 dark:border-white/20 dark:bg-white/[0.03] dark:text-white"
              >
                Keep working
              </Button>
              <Button
                type="button"
                onClick={finishSubmittingAnswers}
                className="rounded-full bg-emerald-700 px-5 text-white hover:bg-emerald-800 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
              >
                Submit anyway
              </Button>
            </div>
          </section>
        </div>,
        document.body
      )}
    </Layout>
  );
}
