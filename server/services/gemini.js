// server/services/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const CHAT_MODEL = process.env.GEMINI_MODEL_CHAT || "gemini-2.5-flash";
const QA_MODEL   = process.env.GEMINI_MODEL_QA   || "gemini-2.5-flash";

const CHAT_KEY = process.env.GEMINI_CHAT_API_KEY || "";
const QA_KEY   = process.env.GEMINI_QA_API_KEY   || "";

if (!CHAT_KEY) console.warn("[PrepMind] GEMINI_CHAT_API_KEY missing.");
if (!QA_KEY)   console.warn("[PrepMind] GEMINI_QA_API_KEY missing.");

function makeClient(key) {
  return new GoogleGenerativeAI(key);
}
export const chatGenAI = makeClient(CHAT_KEY);
export const qaGenAI   = makeClient(QA_KEY);

export const chatModelBase = {
  model: CHAT_MODEL,
  generationConfig: { temperature: 0.2, topK: 40, topP: 0.8, maxOutputTokens: 1024 },
};
export const qaModelBase = {
  model: QA_MODEL,
  generationConfig: { temperature: 0.35, topK: 40, topP: 0.9, maxOutputTokens: 2048 },
};

export function getChatModel(overrides = {}) {
  return chatGenAI.getGenerativeModel({ ...chatModelBase, ...overrides });
}
export function getQaModel(overrides = {}) {
  return qaGenAI.getGenerativeModel({ ...qaModelBase, ...overrides });
}
