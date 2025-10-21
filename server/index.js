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

// IMPORTANT: Render sets PORT for you.
// Do NOT hardcode 10000 in production.
const PORT = Number(process.env.PORT) || 10000;

// Body parsing
app.use(express.json({ limit: "1mb" }));

// CORS (safe default if you serve API + SPA from same origin — it won’t hurt)
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "HEAD"],
  })
);

/* ========= API routes ========= */
app.post("/api/chat", async (req, res) => {
  try {
    const { message = "" } = req.body || {};
    const content = await generateChatResponse(message);
    res.json({ content });
  } catch (err) {
    console.error(err);
    res.status(500).send("Chat error");
  }
});

app.post("/api/generate-questions", async (req, res) => {
  try {
    const payload = req.body || {};
    const questions = await generateQuestions(payload);
    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).send("Question generation error");
  }
});

/* ========= Static + SPA fallback ========= */
const distDir = path.resolve(__dirname, "../dist");

// Serve built assets
app.use(express.static(distDir, { extensions: ["html"] }));

// Helper to send SPA index
const sendIndex = (_req, res) => res.sendFile(path.join(distDir, "index.html"));

// Root + non-API routes → SPA (GET + HEAD)
app.get("/", sendIndex);
app.head("/", (_req, res) => res.sendStatus(200));
app.get(/^\/(?!api).*/, sendIndex);
app.head(/^\/(?!api).*/, (_req, res) => res.sendStatus(200));

/* ========= Start ========= */
app.listen(PORT, () => {
  console.log(`✅ Server listening on :${PORT}`);
  console.log("Has GEMINI_CHAT_API_KEY?", Boolean(process.env.GEMINI_CHAT_API_KEY));
  console.log("Has GEMINI_QA_API_KEY?", Boolean(process.env.GEMINI_QA_API_KEY));
  console.log("Serving static from:", distDir);
});
