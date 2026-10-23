import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TEST_SUBJECTS, TOPIC_OPTIONS, SUPPORTED_FALLBACK_TESTS } from "../client/data/practice-catalog.js";
import { buildFallbackBank, getFallbackBankId } from "../client/lib/fallback-question-bank.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT_DIR = path.join(ROOT, "public", "question-bank");
const BANK_VERSION = 2;

await rm(OUTPUT_DIR, { recursive: true, force: true });
await mkdir(OUTPUT_DIR, { recursive: true });

let totalQuestions = 0;
let totalConfigurations = 0;
for (const testType of Object.keys(TEST_SUBJECTS)) {
  if (!SUPPORTED_FALLBACK_TESTS.has(testType)) continue;
  for (const subject of TEST_SUBJECTS[testType]) {
    for (const topic of ["General", ...(TOPIC_OPTIONS[subject] || [])]) {
      const questions = buildFallbackBank(testType, subject, topic);
      const uniqueQuestionCount = new Set(questions?.map(({ question }) => question)).size;
      const validAnswers = Array.isArray(questions) && questions.every((question) =>
        question.choices.length === 4 && new Set(question.choices).size === 4 &&
        question.answer === "ABCD"[question.answerIndex] &&
        question.explanation.split(/\s+/).length >= 24
      );
      const hasRequiredMath = subject !== "AP Calculus BC" || (
        Array.isArray(questions) && questions.every(({ question }) => question.includes("$"))
      );
      if (!Array.isArray(questions) || questions.length < 50 || uniqueQuestionCount < 50 || !validAnswers || !hasRequiredMath) {
        throw new Error(`Question bank is missing, too small, or lacks its required math: ${testType} / ${subject} / ${topic}`);
      }
      const bankId = getFallbackBankId(testType, subject, topic);
      const version = subject === "AP Calculus BC" ? BANK_VERSION : 1;
      const payload = { version, testType, subject, topic, questions };
      await writeFile(path.join(OUTPUT_DIR, `${bankId}.json`), `${JSON.stringify(payload)}\n`, "utf8");
      totalQuestions += questions.length;
      totalConfigurations += 1;
    }
  }
}

const outputFiles = (await readdir(OUTPUT_DIR)).filter((name) => name.endsWith(".json"));
if (outputFiles.length !== totalConfigurations) {
  throw new Error(`Expected ${totalConfigurations} question-bank files, found ${outputFiles.length}.`);
}

console.log(`Generated ${totalQuestions.toLocaleString()} questions across ${totalConfigurations} configurations (${TEST_SUBJECTS["AP Exams"].length} AP courses and ${TEST_SUBJECTS.SAT.length} SAT sections).`);
