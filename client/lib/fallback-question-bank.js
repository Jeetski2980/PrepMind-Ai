import { readLocalRecord, writeLocalRecord } from "./local-persistence.js";
import { getTopicDetails, SUPPORTED_FALLBACK_TESTS, TOPIC_CATALOG } from "../data/practice-catalog.js";

const FALLBACK_BANK_VERSION = 1;
const BANK_RECORD_PREFIX = `fallback-question-bank-v${FALLBACK_BANK_VERSION}:`;
const QUESTION_COUNT = 55;

const TOPIC_DESCRIPTION_STEMS = [
  "Which statement best describes {topic}?",
  "What is the main focus of {topic}?",
  "Which idea belongs at the center of a review of {topic}?",
  "A study guide needs a concise note on {topic}. Which note is accurate?",
  "Which explanation would correctly introduce {topic} to a classmate?",
  "What should a learner recognize as the defining idea in {topic}?",
  "Which course statement about {topic} is accurate?",
  "Which statement would best summarize the focus of {topic}?",
  "A prompt names {topic}. Which description fits that focus?",
  "Which idea is most directly connected to {topic}?",
  "Which description belongs in the section on {topic}?",
];

const TOPIC_REVIEW_STEMS = [
  "A student is preparing for {topic}. Which central idea belongs on their review sheet?",
  "During tutoring, a learner asks what {topic} means. Which reply is accurate?",
  "Which claim should a reviewer accept about {topic}?",
  "A course prompt turns to {topic}. Which explanation is most relevant?",
  "When explaining {topic} aloud, which statement should a student include?",
  "A classmate asks what {topic} studies. Which answer is clearest?",
  "Which description would keep a review of {topic} accurate?",
  "A lesson objective mentions {topic}. Which goal fits?",
  "What should a concise course note say about {topic}?",
  "A learner checks a draft explanation of {topic}. Which idea belongs?",
  "Which course concept should a student select when reviewing {topic}?",
];

const TOPIC_APPLICATION_STEMS = [
  "Which task is most closely associated with {topic}?",
  "A class wants to practice {topic}. Which activity best matches?",
  "Which example would a student most likely use when discussing {topic}?",
  "A tutor is preparing a short exercise on {topic}. Which task fits?",
  "Which kind of work would most directly demonstrate understanding of {topic}?",
  "A review group is choosing a case study for {topic}. Which one fits?",
  "Which student activity gives the clearest practice with {topic}?",
  "An instructor asks for an example of {topic}. Which response is relevant?",
  "Which investigation belongs most naturally in a unit on {topic}?",
  "A learner wants to apply {topic}. Which task should they choose?",
  "Which scenario would be most useful for practicing {topic}?",
];

const DEFINITION_MATCH_STEMS = [
  "A note defines an area as follows: “{description}” Which topic label fits the note?",
  "A study guide includes this description: “{description}” Which topic is it describing?",
  "A student reads, “{description}” Which course topic should they name?",
  "Which topic is summarized by this statement: “{description}”",
  "A teacher gives this clue: “{description}” Which topic is the clue about?",
  "A review card says, “{description}” Which topic belongs on the other side of the card?",
  "Which topic best matches the definition “{description}”",
  "A class is sorting study notes. The note says, “{description}” Where does it belong?",
  "The following statement describes one area of study: “{description}” Which area?",
  "A student summarizes a course idea: “{description}” Which topic is being summarized?",
  "Which topic label is the best match for “{description}”",
];

const APPLICATION_MATCH_STEMS = [
  "A student is asked to analyze this example: {application}. Which topic is most central?",
  "A review prompt describes the following work: {application}. Which topic does it address?",
  "Which topic is the main focus when a learner works on this example: {application}?",
  "A class studies this case: {application}. Which course topic best fits?",
  "A tutor gives this practice situation: {application}. Which topic should the student use?",
  "Which topic would guide an analysis of this situation: {application}?",
  "A learner encounters this example: {application}. Which topic is involved?",
  "A study group discusses this task: {application}. Which topic are they practicing?",
  "Which topic most directly applies to this classroom example: {application}?",
  "A short exercise asks students to do this: {application}. Which topic is it testing?",
  "A student explains this situation: {application}. Which topic is the best match?",
];

const GENERAL_STEMS = [
  "This mixed {subject} review includes {topic}. {question}",
  "A student working through a mixed {subject} review pauses at {topic}. {question}",
  "In a mixed {subject} practice set, one item focuses on {topic}. {question}",
  "A tutor selects {topic} for a mixed {subject} review. {question}",
  "A learner's mixed {subject} study session reaches {topic}. {question}",
  "One section of a mixed {subject} review covers {topic}. {question}",
  "A class builds a mixed {subject} practice set and includes {topic}. {question}",
  "During a mixed {subject} review, a learner encounters {topic}. {question}",
  "A mixed {subject} study guide includes a section on {topic}. {question}",
  "A student revising for {subject} adds {topic} to a mixed review. {question}",
  "An instructor places {topic} in a mixed {subject} practice set. {question}",
];

function interpolate(template, topicDetails, subject) {
  return template
    .replaceAll("{topic}", topicDetails.name)
    .replaceAll("{subject}", subject)
    .replaceAll("{description}", topicDetails.description)
    .replaceAll("{application}", topicDetails.application);
}

function rotate(items, start, count) {
  if (items.length <= count) return [...items];
  return Array.from({ length: count }, (_unused, index) => items[(start + index) % items.length]);
}

function shuffleWithAnswer(correct, distractors, answerIndex, seed) {
  const pool = rotate(distractors, seed % distractors.length, 3);
  const choices = [];
  let distractorIndex = 0;
  for (let index = 0; index < 4; index += 1) {
    choices.push(index === answerIndex ? correct : pool[distractorIndex++]);
  }
  return choices;
}

function makeExplanation({ subject, topic, description, application, isApplication, usesTopicLabel }) {
  const focus = usesTopicLabel ? `${topic} is the best match because it focuses on ${description.charAt(0).toLowerCase()}${description.slice(1)}` : description;
  const evidence = isApplication
    ? `The example, ${application}, directly uses that focus.`
    : `The question asks about the defining idea in that area.`;
  return `${focus} ${evidence} The other options describe related but distinct areas of ${subject}; their central questions, evidence, or methods differ from the focus named here.`;
}

function greatestCommonDivisor(left, right) {
  let a = Math.abs(left);
  let b = Math.abs(right);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

function fractionLatex(numerator, denominator = 1) {
  const sign = denominator < 0 ? -1 : 1;
  const divisor = greatestCommonDivisor(numerator, denominator);
  const top = (numerator / divisor) * sign;
  const bottom = Math.abs(denominator / divisor);
  return bottom === 1 ? String(top) : `\\frac{${top}}{${bottom}}`;
}

function shuffledChoices(correct, alternatives, answerIndex) {
  const choices = [...alternatives];
  choices.splice(answerIndex, 0, correct);
  return choices;
}

function createCalculusBCSeriesBank(testType) {
  const ratios = [[1, 2], [-1, 2], [1, 3], [2, 3], [-2, 3], [1, 4], [3, 4], [-1, 3], [2, 5], [3, 5], [-3, 4]];
  const exponents = [[2, 1], [3, 2], [1, 1], [1, 2], [5, 4], [3, 4], [5, 2], [4, 3], [2, 3], [7, 4], [5, 3]];

  return Array.from({ length: QUESTION_COUNT }, (_unused, index) => {
    const type = Math.floor(index / 11);
    const variant = index % 11;
      const answerIndex = (index * 3 + 2) % 4;
    let question;
    let correct;
    let alternatives;
    let explanation;
    let difficulty;

    if (type === 0) {
      const a = 2 + variant;
      const [ratioNumerator, ratioDenominator] = ratios[variant];
      const ratio = fractionLatex(ratioNumerator, ratioDenominator);
      const sum = fractionLatex(a * ratioDenominator, ratioDenominator - ratioNumerator);
      const firstRatioTerm = fractionLatex(a * ratioNumerator, ratioDenominator);
      question = String.raw`Find the sum, if it converges: $\sum_{n=0}^{\infty} ${a}(${ratio})^n$.`;
      correct = `$${sum}$`;
      alternatives = [`$${a}$`, `$${firstRatioTerm}$`, "The series diverges because its terms do not approach zero."];
      explanation = `This is a geometric series with first term $${a}$ and common ratio $${ratio}$. Since the absolute value of the ratio is less than 1, the series converges, and its sum is $a/(1-r)=${sum}$.`;
      difficulty = "Medium";
    } else if (type === 1) {
      const [pNumerator, pDenominator] = exponents[variant];
      const p = fractionLatex(pNumerator, pDenominator);
      const converges = pNumerator > pDenominator;
      question = String.raw`Does the series $\sum_{n=1}^{\infty} \frac{1}{n^{${p}}}$ converge or diverge?`;
      correct = converges ? "Converges, because p is greater than 1." : "Diverges, because p is at most 1.";
      alternatives = converges
        ? ["Diverges, because every term is positive.", "Converges only if the signs alternate.", "Diverges, because p is at most 1."]
        : ["Converges, because p is greater than 1.", "Converges only if the signs alternate.", "Diverges, because every positive-term series diverges."];
      explanation = `This is a p-series. A p-series converges exactly when its exponent is greater than 1. Here $p=${p}$, so ${converges ? "the convergence condition is met" : "the convergence condition is not met"}. The exponent rule applies regardless of the first few terms.`;
      difficulty = "Easy";
    } else if (type === 2) {
      const c = 2 + variant;
      const divergent = variant % 2 === 1;
      question = divergent
        ? String.raw`Use the ratio test on $\sum_{n=1}^{\infty} \frac{n!}{${c}^n}$. What conclusion follows?`
        : String.raw`Use the ratio test on $\sum_{n=1}^{\infty} \frac{${c}^n}{n!}$. What conclusion follows?`;
      correct = divergent
        ? "It diverges; the ratio limit grows without bound."
        : "It converges; the ratio limit is 0.";
      alternatives = divergent
        ? ["It converges; the ratio limit is 0.", "The ratio test is inconclusive because the limit is 1.", "It converges only when c is less than 1."]
        : ["It diverges; the ratio limit grows without bound.", "The ratio test is inconclusive because the limit is 1.", "It diverges because the terms alternate."];
      explanation = divergent
        ? `For $a_n=n!/${c}^n$, the ratio of consecutive terms is $(n+1)/${c}$, which grows without bound. The terms therefore do not approach zero, and the series diverges.`
        : `For $a_n=${c}^n/n!$, the ratio of consecutive terms is $${c}/(n+1)$, which approaches 0. Because the ratio limit is less than 1, the series converges absolutely.`;
      difficulty = "Medium";
    } else if (type === 3) {
      const [pNumerator, pDenominator] = exponents[(variant + 3) % exponents.length];
      const p = fractionLatex(pNumerator, pDenominator);
      const terms = 4 + variant;
      const exactNextTerm = pDenominator === 1
        ? fractionLatex(1, (terms + 1) ** pNumerator)
        : `\\frac{1}{(${terms + 1})^{${p}}}`;
      question = String.raw`For the alternating series $\sum_{n=1}^{\infty} \frac{(-1)^{n+1}}{n^{${p}}}$, what is a valid upper bound for the error after ${terms} terms?`;
      correct = `$${exactNextTerm}$`;
      alternatives = [`$\\frac{1}{${terms}^{${p}}}$`, `$\\frac{1}{(${terms + 2})^{${p}}}$`, "$0$"];
      explanation = `The alternating-series error is no larger than the first omitted term, provided the term magnitudes decrease to zero. After ${terms} terms, the next magnitude is $1/(${terms + 1})^{${p}}$, so that value is a valid bound.`;
      difficulty = "Hard";
    } else {
      const radius = 2 + variant;
      const center = variant - 5;
      const centeredTerm = center < 0 ? `(x+${Math.abs(center)})` : `(x-${center})`;
      const centeredDifference = center < 0 ? `x+${Math.abs(center)}` : `x-${center}`;
      question = String.raw`What is the radius of convergence of $\sum_{n=0}^{\infty} \frac{${centeredTerm}^n}{${radius}^n}$?`;
      correct = `$${radius}$`;
      alternatives = [`$\\frac{1}{${radius}}$`, `$${2 * radius}$`, "$\\infty$"];
      explanation = `This power series is geometric in $(${centeredDifference})/${radius}$. It converges when $|${centeredDifference}|/${radius}<1$, which gives $|${centeredDifference}|<${radius}$. The radius of convergence is $${radius}$. The center determines the interval's location, while this radius gives its distance from the center.`;
      difficulty = "Medium";
    }

    return {
      id: `${slugify(`${testType}-ap-calculus-bc-series`)}-${String(index + 1).padStart(2, "0")}`,
      question,
      choices: shuffledChoices(correct, alternatives, answerIndex),
      answer: ["A", "B", "C", "D"][answerIndex],
      answerIndex,
      correctIndex: answerIndex,
      difficulty,
      explanation,
      extendedExplanation: `${explanation} To check your reasoning, identify the method or evidence named in the prompt and connect it directly to the rule being tested. A nearby topic may use similar vocabulary, so choose the one that explains the specific result asked for.`,
      topic: "Series",
      source: "fallback",
    };
  });
}

function createTopicBank({ testType, subject, topic }) {
  const topicDetails = getTopicDetails(subject, topic);
  const courseTopics = TOPIC_CATALOG[subject] || [];
  if (!topicDetails || !courseTopics.length) return null;

  if (testType === "AP Exams" && subject === "AP Calculus BC" && topic === "Series") {
    return createCalculusBCSeriesBank(testType);
  }

  return Array.from({ length: QUESTION_COUNT }, (_unused, index) => {
    const mode = Math.floor(index / 11);
    const formIndex = index % 11;
    const usesTopicLabel = mode >= 3;
    const isApplication = mode === 2 || mode === 4;
    const stemTemplates = [
      TOPIC_DESCRIPTION_STEMS,
      TOPIC_REVIEW_STEMS,
      TOPIC_APPLICATION_STEMS,
      DEFINITION_MATCH_STEMS,
      APPLICATION_MATCH_STEMS,
    ][mode];
    const stem = interpolate(stemTemplates[formIndex], topicDetails, subject);
    const question = stem.endsWith("?") ? stem : `${stem}?`;
    const correct = usesTopicLabel ? topicDetails.name : isApplication ? topicDetails.application : topicDetails.description;
    const distractors = courseTopics.filter(({ name }) => name !== topic).map((item) => (
      usesTopicLabel ? item.name : isApplication ? item.application : item.description
    ));
    const answerIndex = (index * 7 + courseTopics.findIndex(({ name }) => name === topic)) % 4;
    const choices = shuffleWithAnswer(correct, distractors, answerIndex, index + courseTopics.length);

    return {
      id: `${slugify(`${testType}-${subject}-${topic}`)}-${String(index + 1).padStart(2, "0")}`,
      question,
      choices,
      answer: ["A", "B", "C", "D"][answerIndex],
      answerIndex,
      correctIndex: answerIndex,
      difficulty: mode === 0 || mode === 3 ? "Easy" : mode === 1 || mode === 2 ? "Medium" : "Hard",
      explanation: makeExplanation({
        subject,
        topic,
        description: topicDetails.description,
        application: topicDetails.application,
        isApplication,
        usesTopicLabel,
      }),
      extendedExplanation: `${makeExplanation({
        subject,
        topic,
        description: topicDetails.description,
        application: topicDetails.application,
        isApplication,
        usesTopicLabel,
      })} To check your reasoning, identify the method or evidence named in the prompt and connect it directly to the rule being tested. A nearby topic may use similar vocabulary, so choose the one that explains the specific result asked for.`,
      topic,
      source: "fallback",
    };
  });
}

function createGeneralBank({ testType, subject }) {
  const topics = TOPIC_CATALOG[subject] || [];
  if (!topics.length) return null;
  const topicBanks = topics.map(({ name }) => createTopicBank({ testType, subject, topic: name }));

  return Array.from({ length: QUESTION_COUNT }, (_unused, index) => {
    const topicIndex = index % topics.length;
    const topicDetails = topics[topicIndex];
    const bankIndex = Math.floor(index / topics.length) * 11 + ((index * 3) % 11);
    const base = topicBanks[topicIndex][bankIndex % QUESTION_COUNT];
    const frame = GENERAL_STEMS[Math.floor(index / topics.length) % GENERAL_STEMS.length];
    return {
      ...base,
      id: `${slugify(`${testType}-${subject}-general`)}-${String(index + 1).padStart(2, "0")}`,
      question: frame
        .replaceAll("{subject}", subject)
        .replaceAll("{topic}", topicDetails.name)
        .replace("{question}", base.question),
      topic: topicDetails.name,
      source: "fallback",
    };
  });
}

export function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getFallbackBankId(testType, subject, topic = "General") {
  return slugify(`${testType}-${subject}-${topic || "General"}`);
}

export function buildFallbackBank(testType, subject, topic = "General") {
  if (!SUPPORTED_FALLBACK_TESTS.has(testType)) return null;
  if (!TOPIC_CATALOG[subject]) return null;
  return topic && topic !== "General"
    ? createTopicBank({ testType, subject, topic })
    : createGeneralBank({ testType, subject });
}

function validBank(value, minimumCount) {
  return Array.isArray(value) && value.length >= minimumCount && value.every((question) =>
    question && typeof question.question === "string" &&
    Array.isArray(question.choices) && question.choices.length === 4 &&
    Number.isInteger(question.answerIndex) && question.answerIndex >= 0 && question.answerIndex < 4 &&
    typeof question.explanation === "string"
  );
}

function chooseQuestions(questions, count) {
  const shuffled = [...questions];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled.slice(0, count);
}

export async function getFallbackQuestions({ testType, subject, topic, count }) {
  if (!SUPPORTED_FALLBACK_TESTS.has(testType)) {
    throw new Error("A local question bank is not available for this exam yet.");
  }
  const safeTopic = topic || "General";
  const bankId = getFallbackBankId(testType, subject, safeTopic);
  const localRecordKey = `${BANK_RECORD_PREFIX}${bankId}`;
  const cachedQuestions = await readLocalRecord(localRecordKey);
  let questions = validBank(cachedQuestions, count) ? cachedQuestions : null;

  if (!questions) {
    const basePath = import.meta.env.BASE_URL || "/";
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(`${basePath}question-bank/${bankId}.json`, {
        cache: "force-cache",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("The local question bank could not be loaded.");
      const payload = await response.json();
      if (!validBank(payload?.questions, count)) throw new Error("The local question bank is incomplete.");
      questions = payload.questions;
    } catch {
      questions = buildFallbackBank(testType, subject, safeTopic);
      if (!validBank(questions, count)) throw new Error("The local question bank is unavailable.");
    } finally {
      clearTimeout(timeoutId);
    }
    void writeLocalRecord(localRecordKey, questions);
  }

  return chooseQuestions(questions, count);
}

export const FALLBACK_BANK_QUESTIONS_PER_CONFIGURATION = QUESTION_COUNT;
