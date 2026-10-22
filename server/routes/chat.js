// server/routes/chat.js
import { getChatModel } from "../services/gemini.js";

// starter prompt for ai chat bot
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

// remove code blocks and extra backticks
const stripCodeFences = (s) =>
  String(s || "")
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ""))
    .replace(/^`+|`+$/g, "")
    .trim();

// remove markdown formatting, keep plain text
const toPlainNoMarkdown = (s) =>
  stripCodeFences(s)
    .replace(/^\s*#+\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .trim();

export async function generateChatResponse(userMessage = "", history = []) {
  const model = getChatModel({
    systemInstruction: TUTOR_SYSTEM,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1000,
    },
  });
  const priorMessages = Array.isArray(history)
    ? history
        .slice(-10)
        .filter(
          (turn) =>
            turn &&
            ["user", "model"].includes(turn.role) &&
            typeof turn.text === "string" &&
            turn.text.trim()
        )
        .map((turn) => ({
          role: turn.role,
          parts: [{ text: turn.text.trim().slice(0, 900) }],
        }))
    : [];
  const res = await model.generateContent({
    contents: [
      ...priorMessages,
      { role: "user", parts: [{ text: userMessage.trim() }] },
    ],
  });
  const text = res?.response?.text?.() ?? "";
  return toPlainNoMarkdown(text); // keep $...$ intact for KaTeX
}
