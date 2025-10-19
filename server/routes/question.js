// server/routes/questions.js
import { getQaModel } from "../services/gemini.js";

/** ---- System prompt (short & strict) ---- */
const QA_SYSTEM = `
You are an AI exam question generator.

Output Contract:
- Return ONLY valid JSON (no prose, no code fences).
- Schema:
{
  "questions": [
    {
      "question": "string",
      "choices": ["string","string","string","string"],
      "answer": "A" | "B" | "C" | "D",
      "answerIndex": 0 | 1 | 2 | 3,
      "difficulty": "Easy" | "Medium" | "Hard",
      "explanation": "string"
    }
  ]
}

Rules:
- Exactly 4 choices per question.
- Include BOTH "answer" (A–D) and "answerIndex" (0–3) and ensure they match.
- Explanations are short, reasoning-based, and reference the correct choice.
- Use LaTeX for math: $\\frac{a}{b}$, $x^2$, $\\sqrt{x}$, etc.
- NO markdown, NO additional text outside the JSON.
`;

/** ---- JSON schema compatible with Gemini (no additionalProperties/min/max/etc.) ---- */
const schema = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          choices: { type: "array", items: { type: "string" } },
          answer: { type: "string", enum: ["A", "B", "C", "D"] },
          answerIndex: { type: "integer" },
          difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
          explanation: { type: "string" }
        },
        required: ["question", "choices", "answer", "answerIndex", "difficulty", "explanation"]
      }
    }
  },
  required: ["questions"]
};

const strip = (s) =>
  String(s || "")
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ""))
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();

function safeJsonExtract(text) {
  const cleaned = strip(text);
  try { return JSON.parse(cleaned); } catch {}
  const first = cleaned.indexOf("{");
  const last  = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    try { return JSON.parse(cleaned.slice(first, last + 1)); } catch {}
  }
  throw new Error("Could not parse generator JSON.");
}

const letterFromIndex = (i) => ["A","B","C","D"][i] ?? "A";
const indexFromLetter = (c) => ({A:0,B:1,C:2,D:3})[(c||"").toUpperCase()] ?? 0;

function normalizePacket(obj) {
  if (!obj || typeof obj !== "object" || !Array.isArray(obj.questions)) {
    return { questions: [] };
  }
  obj.questions = obj.questions.map((q, i) => {
    const out = { ...q };

    // shape
    if (typeof out.question !== "string") out.question = `Question ${i + 1}?`;
    if (!Array.isArray(out.choices) || out.choices.length !== 4) {
      const base = Array.isArray(out.choices) ? out.choices.slice(0, 4) : [];
      while (base.length < 4) base.push(`Choice ${base.length + 1}`);
      out.choices = base;
    }

    // difficulty
    const diff = (out.difficulty || "Medium").toString();
    out.difficulty = /^(Easy|Medium|Hard)$/i.test(diff)
      ? diff[0].toUpperCase() + diff.slice(1).toLowerCase()
      : "Medium";

    // explanation
    if (typeof out.explanation !== "string") out.explanation = "See the correct choice and steps.";

    // answer consistency
    let ai = Number.isInteger(out.answerIndex) ? out.answerIndex : indexFromLetter(out.answer);
    ai = Math.max(0, Math.min(3, ai));
    let al = typeof out.answer === "string" ? out.answer.toUpperCase() : letterFromIndex(ai);
    if (indexFromLetter(al) !== ai) al = letterFromIndex(ai);
    out.answerIndex = ai;
    out.answer = al;

    return out;
  });
  return obj;
}

/** Build a concise user prompt */
function buildPrompt({ testType, subject, topic, count }) {
  return `
Generate exactly ${count} multiple-choice questions.

Test: ${String(testType || "SAT")}
Subject: ${String(subject || "Math")}
Topic: ${String(topic || "Mixed")}

Constraints:
- 4 choices per question.
- Include both "answer" (A–D) and "answerIndex" (0–3). They MUST match.
- Explanations ≤ 20 words.
- Prefer concise stems; use LaTeX for math ($\\frac{a}{b}$, $x^2$, $\\sqrt{x}$).
- Output ONLY valid JSON; no extra text.
  `.trim();
}

/** Ask Gemini once with JSON mode + schema */
async function askOnce({ testType, subject, topic, count }) {
  const model = getQaModel({
    systemInstruction: QA_SYSTEM,
    generationConfig: {
      temperature: 0.35,
      topK: 40,
      topP: 0.9,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      responseSchema: schema
    }
  });

  const res = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: buildPrompt({ testType, subject, topic, count }) }]}],
  });

  const raw = res?.response?.text?.() ?? "";
  return normalizePacket(safeJsonExtract(raw));
}

/** Batch fallback: generate in chunks of 5 and merge */
async function askBatched({ testType, subject, topic, total }) {
  const CHUNK = 5;
  const packets = [];
  let remaining = total;
  while (remaining > 0) {
    const n = Math.min(CHUNK, remaining);
    const pkt = await askOnce({ testType, subject, topic, count: n });
    packets.push(...(pkt.questions || []));
    remaining -= n;
  }
  return { questions: packets.slice(0, total) };
}

export async function generateQuestions({ testType, subject, topic, numQuestions }) {
  const n = Math.max(1, Math.min(15, Number(numQuestions) || 5));

  // 1) Try single-shot JSON-mode
  try {
    const one = await askOnce({ testType, subject, topic, count: n });
    if (Array.isArray(one.questions) && one.questions.length === n) {
      return one;
    }
  } catch (e) {
    console.warn("[generator] single-shot failed, falling back to batched:", e?.message || e);
  }

  // 2) Fallback: batched generation (reliable for 10–20)
  const merged = await askBatched({ testType, subject, topic, total: n });
  return merged;
}
