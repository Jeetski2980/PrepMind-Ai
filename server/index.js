// server/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { generateChatResponse } from "./routes/chat.js";
import { generateQuestions } from "./routes/question.js"; // NOTE: singular "question.js"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
//const PORT = Number(process.env.PORT || 10000);
const PORT = Number(10000);

app.use(cors());
app.use(express.json());

// Debug logging (helpful locally + on Render)
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

/* ========= API (keep above SPA) ========= */
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, port: PORT });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body || {};
    const response = await generateChatResponse(message);
    res.json({ response, content: response });
  } catch (err) {
    console.error("[/api/chat] error:", err);
    res.status(500).json({ error: "Chat generation failed." });
  }
});

app.post("/api/generate-questions", async (req, res) => {
  try {
    const { testType, subject, topic, numQuestions } = req.body || {};
    const payload = await generateQuestions({ testType, subject, topic, numQuestions });
    res.json(payload);
  } catch (err) {
    console.error("[/api/generate-questions] error:", err);
    res.status(500).json({
      error: "Question generation failed.",
      details: String(err?.message || err),
    });
  }
});

/* ========= Static + SPA fallback ========= */
const distDir = path.resolve(__dirname, "../dist");

// Serve static assets (JS/CSS/fonts)
app.use(express.static(distDir, { extensions: ["html"] }));

// Helper to send the SPA entry
const sendIndex = (_req, res) => res.sendFile(path.join(distDir, "index.html"));

// Root handlers
app.get("/", sendIndex);
app.head("/", (_req, res) => res.sendStatus(200));

// Non-API routes → SPA (GET + HEAD)
app.get(/^\/(?!api).*/, sendIndex);
app.head(/^\/(?!api).*/, (_req, res) => res.sendStatus(200));

/* ========= Start ========= */
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log("Has GEMINI_CHAT_API_KEY?", Boolean(process.env.GEMINI_CHAT_API_KEY));
  console.log("Has GEMINI_QA_API_KEY?", Boolean(process.env.GEMINI_QA_API_KEY));
  console.log("Serving static from:", distDir);
});
