// server/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { generateChatResponse } from "./routes/chat.js";
import { generateQuestions } from "./routes/question.js";
import {
  createConcurrencyLimiter,
  createRateLimiter,
} from "./middleware/rateLimit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Render places one proxy in front of the Express server.
app.set("trust proxy", 1);

// IMPORTANT: Render provides PORT automatically
const PORT = Number(process.env.PORT) || 10000;

const defaultOrigins = [
  "https://prepmind.org",
  "https://www.prepmind.org",
  "http://localhost:5173",
  "http://localhost:4173",
];
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || defaultOrigins.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

// Middleware (the middle between a request and the final response)
app.use(express.json({ limit: "16kb", strict: true }));
app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header include same-origin and server requests.
      callback(null, !origin || allowedOrigins.has(origin));
    },
    methods: ["GET", "POST", "HEAD"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use("/api", (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

const chatBurstLimit = createRateLimiter({
  windowMs: 60 * 1000,
  limit: 15,
  message: "Too many tutor messages. Please wait a minute and try again.",
});
const chatDailyLimit = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 75,
  message: "You reached today's tutor limit. Please try again tomorrow.",
});
const questionBurstLimit = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  message: "Too many question sets. Please wait a few minutes and try again.",
});
const questionDailyLimit = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 15,
  message: "You reached today's question-generation limit. Please try again tomorrow.",
});
const geminiConcurrencyLimit = createConcurrencyLimiter({
  limit: 4,
  message: "PrepMind is busy right now. Please try again shortly.",
});

function validShortText(value, maxLength) {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

// API ROUTES
// Chat (Tutor)
app.post(
  "/api/chat",
  chatBurstLimit,
  chatDailyLimit,
  geminiConcurrencyLimit,
  async (req, res) => {
    try {
      const { message } = req.body || {};
      if (!validShortText(message, 350)) {
        return res.status(400).json({
          error: "Your message must be between 1 and 350 characters.",
        });
      }

      const content = await generateChatResponse(message);
      res.json({ content });
    } catch (err) {
      console.error("[/api/chat] error:", err?.message || err);
      res.status(500).json({ error: "Chat is temporarily unavailable." });
    }
  }
);

// Practice / Generate Questions
app.post(
  "/api/generate-questions",
  questionBurstLimit,
  questionDailyLimit,
  geminiConcurrencyLimit,
  async (req, res) => {
    try {
      const payload = req.body || {};
      const fieldsAreValid =
        validShortText(payload.testType, 30) &&
        validShortText(payload.subject, 80) &&
        (payload.topic == null || validShortText(payload.topic, 100));

      if (!fieldsAreValid) {
        return res.status(400).json({
          error: "The selected test, subject, or topic is invalid.",
        });
      }

      const requestedCount = Number(payload.numQuestions);
      if (
        !Number.isInteger(requestedCount) ||
        requestedCount < 1 ||
        requestedCount > 15
      ) {
        return res.status(400).json({
          error: "Choose between 1 and 15 questions.",
        });
      }

      const result = await generateQuestions({
        ...payload,
        numQuestions: requestedCount,
      });
      res.json({ questions: result.questions || [] });
    } catch (err) {
      console.error("[/api/generate-questions] error:", err?.message || err);
      res.status(500).json({
        error: "Question generation is temporarily unavailable.",
      });
    }
  }
);

// STATIC + SPA FALLBACK
// If someone types a route like /about, it tries /about.html
// Show files from the dist folder. If missing, try adding .html
const distDir = path.resolve(__dirname, "../dist");
app.use(express.static(distDir, { extensions: ["html"] }));

const sendIndex = (_req, res) =>
  res.sendFile(path.join(distDir, "index.html"));

app.get("/", sendIndex);
app.head("/", (_req, res) => res.sendStatus(200));
app.get(/^\/(?!api).*/, sendIndex);
app.head(/^\/(?!api).*/, (_req, res) => res.sendStatus(200));

// local host message
app.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
  console.log(
    "Has GEMINI_CHAT_API_KEY?",
    Boolean(process.env.GEMINI_CHAT_API_KEY)
  );
  console.log(
    "Has GEMINI_QA_API_KEY?",
    Boolean(process.env.GEMINI_QA_API_KEY)
  );
});
