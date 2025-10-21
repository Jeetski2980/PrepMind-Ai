// server/services/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// Models
const CHAT_MODEL = process.env.GEMINI_MODEL_CHAT || "gemini-2.5-flash";
const QA_MODEL   = process.env.GEMINI_MODEL_QA   || "gemini-2.5-flash";

// Keys
const CHAT_KEY = process.env.GEMINI_CHAT_API_KEY || process.env.GOOGLE_API_KEY || "";
const QA_KEY   = process.env.GEMINI_QA_API_KEY   || process.env.GOOGLE_API_KEY || "";

// Logs (safe — only booleans)
console.log("Has GEMINI_CHAT_API_KEY?", Boolean(CHAT_KEY));
console.log("Has GEMINI_QA_API_KEY?", Boolean(QA_KEY));

export function getChatModel(overrides = {}) {
  const genAI = new GoogleGenerativeAI(CHAT_KEY);
  return genAI.getGenerativeModel({ model: CHAT_MODEL, ...overrides });
}

export function getQaModel(overrides = {}) {
  const genAI = new GoogleGenerativeAI(QA_KEY); // 👈 Must be QA key
  return genAI.getGenerativeModel({ model: QA_MODEL, ...overrides });
}
