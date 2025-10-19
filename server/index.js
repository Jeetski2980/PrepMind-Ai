// server/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { generateChatResponse } from "./routes/chat.js";
import { generateQuestions } from "./routes/questions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 10000);

app.use(cors());
app.use(express.json());

// --- Debug logging (leave on for now) ---
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

/* =========================
   API ROUTES (keep above SPA)
   ========================= */
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

/* =========================
   STATIC + SPA FALLBACK
   ========================= */
const distDir = path.resolve(__dirname, "../dist");

// Serve static files (JS/CSS/fonts)
app.use(express.static(distDir, { extensions: ["html"] }));

// Helper to send index.html
const sendIndex = (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
};

// Explicit root handlers
app.get("/", sendIndex);
app.head("/", (_req, res) => res.sendStatus(200)); // handle HEAD /

// SPA fallback for any non-API path (GET or HEAD)
app.get(/^\/(?!api).*/, sendIndex);
app.head(/^\/(?!api).*/, (_req, res) => res.sendStatus(200));

/* =========================
   START SERVER
   ========================= */
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log("Has GEMINI_CHAT_API_KEY?", Boolean(process.env.GEMINI_CHAT_API_KEY));
  console.log("Has GEMINI_QA_API_KEY?", Boolean(process.env.GEMINI_QA_API_KEY));
  console.log("Serving static from:", distDir);
});
