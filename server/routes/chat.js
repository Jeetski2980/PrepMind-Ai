// server/routes/chat.js
import { getChatModel } from "../services/gemini.js";

const TUTOR_SYSTEM = `
You are a helpful, concise SAT/ACT/AP tutor.

Rules:
- If the user asks a math, science, or grammar problem → solve it step-by-step.
- If unclear → ask ONE clarifying question.
- Never say "undefined" or "not sure" if solvable.
- Be direct, friendly, never verbose.
- Use LaTeX formatting for ALL math:
  - Inline math: $...$
  - Display math: $$...$$
- Do NOT use code blocks, backticks, markdown headings, or extra disclaimers.
- Always end numeric solutions with "Final Answer:" on its own line followed by the final value.
- Prefer simplified exact forms when reasonable (e.g., fractions, radicals).
`;

const stripCodeFences = (s) =>
  String(s || "")
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ""))
    .replace(/^`+|`+$/g, "")
    .trim();

const toPlainNoMarkdown = (s) =>
  stripCodeFences(s)
    .replace(/^\s*#+\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .trim();

export async function generateChatResponse(userMessage = "") {
  const model = getChatModel({ systemInstruction: TUTOR_SYSTEM });
  const res = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: userMessage.trim() }]}],
  });
  const text = res?.response?.text?.() ?? "";
  return toPlainNoMarkdown(text); // keep $...$ intact for KaTeX
}
