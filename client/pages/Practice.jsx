import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle, XCircle, Lightbulb, RotateCcw } from "lucide-react";
import Layout from "@/components/Layout.jsx";
import ApiKeyNoticeGoogle from "@/components/ApiKeyNoticeGoogle";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

// defines all exams and their subjects for dropdown selection

const TEST_SUBJECTS = {
  SAT: ["Math", "Reading and Writing"],
  ACT: ["Math", "Reading", "English", "Science (Optional)"],
  "AP Exams": [
    "AP Calculus AB",
    "AP Calculus BC",
    "AP Statistics",
    "AP Physics 1: Algebra-Based",
    "AP Physics 2: Algebra-Based",
    "AP Physics C: Mechanics",
    "AP Physics C: Electricity and Magnetism",
    "AP Chemistry",
    "AP Biology",
    "AP English Language and Composition",
    "AP English Literature and Composition",
    "AP United States History",
    "AP World History: Modern",
    "AP United States Government and Politics",
    "AP Psychology",
    "AP Computer Science A",
  ],
};
// maps each subject to its list of topics for filtering or practice selection
const TOPIC_OPTIONS = {
  Math: ["Algebra", "Geometry", "Trigonometry", "Statistics", "Functions"],
  "Reading and Writing": ["Information and Ideas", "Craft and Structure", "Expression of Ideas", "Standard English Conventions"],
  Reading: ["Reading Comprehension", "Vocabulary", "Main Ideas", "Inferences"],
  English: ["Grammar", "Punctuation", "Style", "Strategy"],
  "Science (Optional)": ["Data Analysis", "Scientific Reasoning", "Research Summaries"],
  // AP
  "AP Calculus AB": ["Limits", "Derivatives", "Integrals", "Applications"],
  "AP Calculus BC": ["Series", "Parametric Equations", "Polar Coordinates", "Advanced Integration"],
  "AP Statistics": ["Probability", "Sampling", "Inference", "Regression"],
  "AP Physics 1: Algebra-Based": ["Kinematics", "Forces", "Energy", "Waves"],
  "AP Physics 2: Algebra-Based": ["Fluid Mechanics", "Thermodynamics", "Electrostatics", "Magnetism"],
  "AP Physics C: Mechanics": ["Kinematics", "Forces", "Energy", "Momentum"],
  "AP Physics C: Electricity and Magnetism": ["Electrostatics", "Conductors and Capacitors", "Electric Circuits", "Magnetic Fields"],
  "AP Chemistry": ["Atomic Structure", "Chemical Bonding", "Reactions", "Thermodynamics"],
  "AP Biology": ["Cell Biology", "Genetics", "Evolution", "Ecology"],
  "AP English Language and Composition": ["Rhetorical Analysis", "Synthesis", "Argument Writing", "Language Use"],
  "AP English Literature and Composition": ["Poetry Analysis", "Prose Analysis", "Literary Devices", "Thematic Analysis"],
  "AP United States History": ["Colonial Period", "Revolutionary Era", "Civil War", "Modern America"],
  "AP World History: Modern": ["The Global Tapestry", "Networks of Exchange", "Land-Based Empires", "Globalization"],
  "AP United States Government and Politics": ["Constitutional Principles", "Political Institutions", "Civil Rights", "Public Policy"],
  "AP Psychology": ["Biological Bases", "Sensation and Perception", "Learning", "Cognition"],
  "AP Computer Science A": ["Object-Oriented Programming", "Data Structures", "Algorithms", "Program Design"],
};

/* ---------- Math rendering ---------- */
// converts text into JSX with proper math rendering (KaTeX) and bold formatting
const renderTextWithMath = (text) => {
  if (text == null) return null;
  let s = String(text);

  // converts \( \) and \[ \] into $ and $$ format for KaTeX
  s = s
    .replace(/\\\(([\s\S]+?)\\\)/g, (_m, p1) => `$${p1}$`)
    .replace(/\\\[([\s\S]+?)\\\]/g, (_m, p1) => `$$${p1}$$`);

  if (!s.includes("$")) {
    if (/^\s*\\[A-Za-z]/.test(s.trim())) {
      s = `$${s}$`;
    } else {
      const CHUNK =
        /(\\frac\{[^{}]+\}\{[^{}]+\}|\\sqrt\{[^{}]+\}|\\hat\{[^{}]+\}|\\bar\{[^{}]+\}|\\vec\{[^{}]+\}|\\int[^ \n]*|\\sum[^ \n]*|\\lim[^ \n]*|\\log(?:_[^{\s]+|\([^)]*\))?|\\sin|\\cos|\\tan|\\pi|\\theta|\\alpha|\\beta|\\gamma|\\delta|\\lambda|\\mu|\\sigma|\\leq|\\geq|\\neq|\\ne)/g;
      s = s.replace(CHUNK, (m) => `$${m}$`);
    }
  }

  if (s.split("$").length % 2 === 0) {
    s = s.replace(/\$/g, "");
  }

  const parts = s.split(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g);

  return parts.map((part, i) => {
    if (part.startsWith("$$") && part.endsWith("$$")) {
      const math = part.slice(2, -2);
      try { return <BlockMath key={i} math={math} />; }
      catch { return <span key={i}>{part}</span>; }
    }
    if (part.startsWith("$") && part.endsWith("$")) {
      const math = part.slice(1, -1);
      try { return <InlineMath key={i} math={math} />; }
      catch { return <span key={i}>{part}</span>; }
    }
    return (
      <span
        key={i}
        dangerouslySetInnerHTML={{
          __html: part.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
        }}
      />
    );
  });
};

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const availableSubjects = testType ? TEST_SUBJECTS[testType] || [] : [];
  const availableTopics = subject ? TOPIC_OPTIONS[subject] || [] : [];

  const suggestTopics = () => {
    if (subject && availableTopics.length > 0) {
      const r = availableTopics[Math.floor(Math.random() * availableTopics.length)];
      setTopic(r);
    }
  };

  async function generateQuestions() {
    if (!testType || !subject) return;
    setIsGenerating(true);
    setError("");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      // clamp to max 15
      const safeNum = Math.min(15, Math.max(1, parseInt(numQuestions, 10) || 5));

      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testType,
          subject,
          topic: topic || "General",
          numQuestions: safeNum,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        let msg = "Failed to generate questions. Please try again.";
        try { msg = (await res.json())?.error || msg; } catch {}
        setError(msg);
        setIsGenerating(false);
        return;
      }

      const data = await res.json();

      const letterToIndex = { A: 0, B: 1, C: 2, D: 3 };
      const normalized = (data?.questions || []).map((q) => {
        const idx =
          Number.isInteger(q?.answerIndex)
            ? q.answerIndex
            : Number.isInteger(q?.correctIndex)
            ? q.correctIndex
            : letterToIndex[(q?.answer || "").toUpperCase()] ?? 0;
        return { ...q, answerIndex: idx, correctIndex: idx, choices: q.choices || [] };
      });

      if (normalized.length === 0) {
        setError("No questions were generated. Please try again.");
        setIsGenerating(false);
        return;
      }

      setQuestions(normalized);
      setCurrentQuestion(0);
      setSelectedAnswers({});
      setShowResults(false);
    } catch (e) {
      if (e.name === "AbortError") {
        setError("AI is taking a while. Try again or reduce the number of questions.");
      } else if (String(e.message || "").includes("Failed to fetch")) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError("Error generating questions. Please try again.");
      }
      console.error("Error generating questions:", e);
    }

    setIsGenerating(false);
  }

  const selectAnswer = (qIdx, aIdx) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: aIdx }));
  };

  const submitAnswers = () => setShowResults(true);

  const resetQuiz = () => {
    setQuestions([]);
    setCurrentQuestion(0);
    setSelectedAnswers({});
    setShowResults(false);
    setError("");
  };

  const calculateScore = () => {
    if (!questions.length) return 0;
    let correct = 0;
    questions.forEach((q, i) => {
      const selected = selectedAnswers[i];
      const correctIdx = Number.isInteger(q.answerIndex)
        ? q.answerIndex
        : ({ A: 0, B: 1, C: 2, D: 3 }[q.answer?.toUpperCase()] ?? 0);
      if (selected === correctIdx) correct += 1;
    });
    return Math.round((correct / questions.length) * 100);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-black py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-400/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Build your practice set
            </h1>
            <p className="text-gray-600 dark:text-white/70">
              Choose what you want to work on. You can change these choices any time.
            </p>
          </div>

          {questions.length === 0 ? (
            <div className="space-y-5">
              <ApiKeyNoticeGoogle />

              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/[0.03] sm:p-8">
                <div className="mb-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-700 dark:text-emerald-400">Create a focused session</p>
                  <h2 className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">What are you studying today?</h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-white/60">Set up a practice session that works for you.</p>
                </div>

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
                    <p className="mt-1 text-sm text-gray-500 dark:text-white/55">
                      {testType && subject ? "Ready when you are." : "Choose an exam and subject to get started."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={generateQuestions}
                    disabled={!testType || !subject || isGenerating}
                    className="min-h-12 rounded-full bg-emerald-700 px-6 text-white hover:bg-emerald-800 disabled:opacity-50 dark:bg-emerald-400 dark:text-black dark:hover:bg-emerald-300"
                  >
                    {isGenerating ? "Building your set..." : "Preview a practice session"}
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
              {/* Progress */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-white/70">
                  {testType} - {subject} {topic && `- ${topic}`}
                </div>
                <div className="text-sm text-gray-600 dark:text-white/70">
                  Question {currentQuestion + 1} of {questions.length}
                </div>
              </div>

              {!showResults ? (
                /* Current Question */
                <Card className="bg-white dark:bg-black border dark:border-white/20">
                  <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-white">
                      Question {currentQuestion + 1}
                      <Badge variant="outline" className="ml-2 dark:border-white/50 dark:text-white">
                        {questions[currentQuestion]?.difficulty || "Medium"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-gray-900 dark:text-white mb-6 text-lg">
                      {renderTextWithMath(questions[currentQuestion]?.question)}
                    </div>

                    <div className="space-y-3">
                      {questions[currentQuestion]?.choices.map((choice, index) => (
                        <button
                          key={index}
                          onClick={() => selectAnswer(currentQuestion, index)}
                          className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
                            selectedAnswers[currentQuestion] === index
                              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-400/10 dark:border-emerald-400"
                              : "border-gray-200 dark:border-white/20 hover:border-gray-300 dark:hover:border-white/70"
                          }`}
                        >
                          <div className="flex items-center">
                            <span className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center mr-3 text-sm font-semibold">
                              {String.fromCharCode(65 + index)}
                            </span>
                            <span className="text-gray-900 dark:text-white">
                              {renderTextWithMath(choice)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-between mt-8">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                        disabled={currentQuestion === 0}
                        className="dark:bg-black dark:border-white/50 dark:text-white"
                      >
                        Previous
                      </Button>

                      {currentQuestion === questions.length - 1 ? (
                        <Button
                          onClick={submitAnswers}
                          disabled={Object.keys(selectedAnswers).length !== questions.length}
                          className="bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white dark:text-black"
                        >
                          Submit Answers
                        </Button>
                      ) : (
                        <Button
                          onClick={() =>
                            setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))
                          }
                          className="bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white dark:text-black"
                        >
                          Next
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Results */
                <div className="space-y-6">
                  <Card className="bg-white dark:bg-black border dark:border-white/20">
                    <CardHeader>
                      <CardTitle className="text-center text-gray-900 dark:text-white">
                        Quiz Complete! Your Score: {calculateScore()}%
                      </CardTitle>
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
                            {selectedAnswers[qIndex] === correctIdx ? (
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
                                  {renderTextWithMath(choice)}
                                </span>
                              </div>
                            ))}
                          </div>

                         <div className="explanation-box">
                           <h4 className="font-semibold mb-2">Explanation:</h4>
                            <div>{renderTextWithMath(q.explanation)}</div>
                         </div>

                        </CardContent>
                      </Card>
                    );
                  })}

                  <div className="flex justify-center">
                    <Button
                      onClick={resetQuiz}
                      className="bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white dark:text-black"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Take Another Practice Set
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
