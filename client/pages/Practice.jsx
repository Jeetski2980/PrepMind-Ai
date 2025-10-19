import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle, XCircle, Lightbulb, RotateCcw } from "lucide-react";
import Layout from "@/components/Layout";
import ApiKeyNoticeGoogle from "@/components/ApiKeyNoticeGoogle";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

/* ---------- Config ---------- */

const TEST_SUBJECTS = {
  SAT: ["Math", "Reading", "Writing"],
  ACT: ["Math", "Reading", "English", "Science"],
  "AP Exams": [
    "Calculus AB","Calculus BC","Statistics","Physics 1","Physics 2",
    "Physics C","Chemistry","Biology","English Language","English Literature",
    "US History","World History","Government","Psychology","Computer Science A"
  ],
};

const TOPIC_OPTIONS = {
  Math: ["Algebra","Geometry","Trigonometry","Statistics","Functions"],
  Reading: ["Reading Comprehension","Vocabulary","Main Ideas","Inferences"],
  Writing: ["Grammar","Sentence Structure","Essay Writing","Rhetorical Analysis"],
  English: ["Grammar","Punctuation","Style","Strategy"],
  Science: ["Data Analysis","Scientific Reasoning","Research Summaries"],
  // AP
  "Calculus AB": ["Limits","Derivatives","Integrals","Applications"],
  "Calculus BC": ["Series","Parametric Equations","Polar Coordinates","Advanced Integration"],
  Statistics: ["Probability","Sampling","Inference","Regression"],
  "Physics 1": ["Kinematics","Forces","Energy","Waves"],
  "Physics 2": ["Fluid Mechanics","Thermodynamics","Electrostatics","Magnetism"],
  "Physics C": ["Mechanics","Electricity & Magnetism","Advanced Calculus"],
  Chemistry: ["Atomic Structure","Chemical Bonding","Reactions","Thermodynamics"],
  Biology: ["Cell Biology","Genetics","Evolution","Ecology"],
  "English Language": ["Rhetorical Analysis","Synthesis","Argument Writing","Language Use"],
  "English Literature": ["Poetry Analysis","Prose Analysis","Literary Devices","Thematic Analysis"],
  "US History": ["Colonial Period","Revolutionary Era","Civil War","Modern America"],
  "World History": ["Ancient Civilizations","Medieval Period","Renaissance","Modern World"],
  Government: ["Constitutional Principles","Political Institutions","Civil Rights","Public Policy"],
  Psychology: ["Biological Bases","Sensation & Perception","Learning","Cognition"],
  "Computer Science A": ["Object-Oriented Programming","Data Structures","Algorithms","Program Design"],
};

/* ---------- Robust math rendering with nested-brace auto-wrap ---------- */
/* ---------- Math rendering (robust + conservative) ---------- */
/* Fixes common missing-backslash LaTeX and renders with KaTeX. */

import "katex/dist/katex.min.css";

const renderTextWithMath = (text) => {
  if (text == null) return null;
  let s = String(text);

  // Normalize \( … \) and \[ … \] to $…$ and $$…$$
  s = s
    .replace(/\\\((.+?)\\\)/g, (_m, p1) => `$${p1}$`)
    .replace(/\\\[(.+?)\\\]/gs, (_m, p1) => `$$${p1}$$`);

  // --- Heuristic auto-fix when no $ is present (model forgot backslashes) ---
  if (!s.includes("$")) {
    // Add missing backslashes for very common LaTeX words
    const NEEDS_SLASH =
      /\b(frac|sqrt|sum|int|infty|pi|theta|alpha|beta|gamma|delta|lambda|mu|sigma|leq|geq|neq|ne|cdot|times)\b/g;
    s = s.replace(NEEDS_SLASH, "\\$1");

    // Convert bare \frac a b  OR  \frac1n^2  into \frac{a}{b}
    // 1) already-braced -> keep
    // 2) no braces -> wrap next two tokens
    s = s.replace(/\\frac\s*([^\s{]+)\s*([^\s{]+)/g, (_m, a, b) => `\\frac{${a}}{${b}}`);
    // also normalize the proper braced case (idempotent)
    s = s.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, (_m, a, b) => `\\frac{${a}}{${b}}`);

    // \sqrt a -> \sqrt{a}
    s = s.replace(/\\sqrt\s*([^\s{][^\s]*)/g, (_m, a) => `\\sqrt{${a}}`);

    // If we now see math-ish things, wrap the whole line in inline math
    if (
      /\\(frac|sqrt|sum|int|pi|theta|alpha|beta|gamma|delta|lambda|mu|sigma|leq|geq|neq|ne|infty|cdot|times)|[_^]/.test(
        s
      )
    ) {
      s = `$${s}$`;
    }
  }
  // -------------------------------------------------------------------------

  // If $ are unbalanced, strip them to prevent KaTeX crash
  const balanced = s.split("$").length % 2 === 1 ? s.replace(/\$/g, "") : s;

  // Split into text / $…$ / $$…$$
  const parts = balanced.split(/(\$\$[\s\S]+?\$\$|\$[\s\S]*?\$)/g);

  return parts.map((part, i) => {
    if (part.startsWith("$$") && part.endsWith("$")) {
      // guard against malformed $$…$
      return <span key={i}>{part}</span>;
    }
    if (part.startsWith("$$") && part.endsWith("$$")) {
      const math = part.slice(2, -2);
      try {
        return <BlockMath key={i} math={math} />;
      } catch {
        return <span key={i}>{part}</span>;
      }
    }
    if (part.startsWith("$") && part.endsWith("$")) {
      const math = part.slice(1, -1);
      try {
        return <InlineMath key={i} math={math} />;
      } catch {
        return <span key={i}>{part}</span>;
      }
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
              AI Practice Questions
            </h1>
            <p className="text-gray-600 dark:text-white/70">
              Get personalized practice questions generated by AI for your specific test and subject
            </p>
          </div>

          {questions.length === 0 ? (
            <div>
              <ApiKeyNoticeGoogle />

              <Card className="bg-white dark:bg-black border dark:border-white/20">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-white">Choose Your Test</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Test Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                        Test Type
                      </label>
                      <Select value={testType} onValueChange={setTestType}>
                        <SelectTrigger className="dark:bg-black dark:border-white/50 dark:text-white">
                          <SelectValue placeholder="Select test type" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-black dark:border-white/50">
                          <SelectItem value="SAT">SAT</SelectItem>
                          <SelectItem value="ACT">ACT</SelectItem>
                          <SelectItem value="AP Exams">AP Exams</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Subject */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                        Subject
                      </label>
                      <Select value={subject} onValueChange={setSubject} disabled={!testType}>
                        <SelectTrigger className="dark:bg-black dark:border-white/50 dark:text-white">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-black dark:border-white/50">
                          {availableSubjects.map((subj) => (
                            <SelectItem key={subj} value={subj}>
                              {subj}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Number of Questions (max 15) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                        Number of Questions
                      </label>
                      <Select value={numQuestions} onValueChange={setNumQuestions}>
                        <SelectTrigger className="dark:bg-black dark:border-white/50 dark:text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-black dark:border-white/50">
                          <SelectItem value="5">5 Questions</SelectItem>
                          <SelectItem value="10">10 Questions</SelectItem>
                          <SelectItem value="15">15 Questions</SelectItem>
                          {/* 20 removed intentionally */}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Topic Selection */}
                  {availableTopics.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-white">
                          Specific Topic (Optional)
                        </label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={suggestTopics}
                          className="dark:bg-black dark:text-white dark:hover:text-emerald-400 dark:border-white/50 dark:hover:border-emerald-400"
                        >
                          <Lightbulb className="w-4 h-4 mr-1" />
                          Suggest Topics
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {availableTopics.map((topicOption) => (
                          <Badge
                            key={topicOption}
                            variant={topic === topicOption ? "default" : "outline"}
                            className={`cursor-pointer transition-colors ${
                              topic === topicOption
                                ? "bg-emerald-600 dark:bg-emerald-400 text-white dark:text-black"
                                : "hover:bg-emerald-50 dark:hover:bg-emerald-400/10 dark:text-white dark:border-white/50"
                            }`}
                            onClick={() => setTopic(topic === topicOption ? "" : topicOption)}
                          >
                            {topicOption}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={generateQuestions}
                    disabled={!testType || !subject || isGenerating}
                    className="w-full bg-emerald-600 dark:bg-emerald-400 hover:bg-emerald-700 dark:hover:bg-emerald-500 text-white dark:text-black"
                  >
                    {isGenerating ? "Generating Questions..." : "Generate Practice Questions"}
                  </Button>

                  {/* Error */}
                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg">
                      <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Loader */}
                  {isGenerating && (
                    <div className="loader">
                      <div className="cell d-0"></div>
                      <div className="cell d-1"></div>
                      <div className="cell d-2"></div>
                      <div className="cell d-1"></div>
                      <div className="cell d-2"></div>
                      <div className="cell d-2"></div>
                      <div className="cell d-3"></div>
                      <div className="cell d-3"></div>
                      <div className="cell d-4"></div>
                    </div>
                  )}
                </CardContent>
              </Card>
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

                          <div className="bg-blue-50 dark:bg-white/10 p-4 rounded-lg border dark:border-white/30">
                            <h4 className="font-semibold text-blue-900 dark:text-white mb-2">
                              Explanation:
                            </h4>
                            <div className="text-blue-800 dark:text-white/80">
                              {renderTextWithMath(q.explanation)}
                            </div>
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
