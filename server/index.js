// server/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { generateChatResponse } from "./routes/chat.js";
import { generateQuestions } from "./routes/question.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// IMPORTANT: Render provides PORT automatically
const PORT = Number(process.env.PORT) || 10000;

// Middleware
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "HEAD"],
  })
);

// ========= API ROUTES =========

// Chat (Tutor)
app.post("/api/chat", async (req, res) => {
  try {
    const { message = "" } = req.body || {};
    const content = await generateChatResponse(message);
    res.json({ content });
  } catch (err) {
    console.error("[/api/chat] error:", err?.message || err);
    res.status(500).send("Chat error");
  }
});

// Practice / Generate Questions
app.post("/api/generate-questions", async (req, res) => {
  try {
    const payload = req.body || {};
    const result = await generateQuestions(payload);
    res.json({ questions: result.questions || [] });
  } catch (err) {
    console.error("[/api/generate-questions] error:", err?.message || err);
    res.status(500).send("Question generation error");
  }
});

// ========= STATIC + SPA FALLBACK =========
const distDir = path.resolve(__dirname, "../dist");
app.use(express.static(distDir, { extensions: ["html"] }));

const sendIndex = (_req, res) => res.sendFile(path.join(distDir, "index.html"));

app.get("/", sendIndex);
app.head("/", (_req, res) => res.sendStatus(200));
app.get(/^\/(?!api).*/, sendIndex);
app.head(/^\/(?!api).*/, (_req, res) => res.sendStatus(200));

// ========= START =========
app.listen(PORT, () => {
  console.log(`✅ Server listening on :${PORT}`);
  console.log("Has GEMINI_CHAT_API_KEY?", Boolean(process.env.GEMINI_CHAT_API_KEY));
  console.log("Has GEMINI_QA_API_KEY?", Boolean(process.env.GEMINI_QA_API_KEY));
});
