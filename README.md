# Prep Mind AI

**Live site:** [https://prepmind.org](https://prepmind.org)  
**Video demonstration:** *(Replace with your public HTTPS video URL)*  
**License:** [MIT](./LICENSE)

---

## Overview

Prep Mind AI is a free, browser-based test-prep application for SAT, ACT, and AP practice.  
The project is designed for performance, simplicity, and data minimization. It runs entirely in the browser, using an optional backend proxy to securely access LLM APIs.  
No accounts, databases, or analytics are used.

---

## Core Technologies

- **Frontend:** React + Vite + Tailwind CSS  
- **Math Rendering:** KaTeX  
- **Backend (optional):** Node.js + Express (API proxy)  
- **Model Provider:** Google AI Studio (Gemini family)  
- **Build System:** Vite for client, Node scripts for server

---

## Architecture

Client-side requests are handled by the frontend UI.  
If an API proxy is enabled, calls flow through the Express backend before reaching the model provider.

```
Browser (React UI)
  ↓
/api/*  (Express Proxy)
  ↓
Gemini Model Provider (Google AI Studio)
  ↓
JSON → Rendered Question/Explanation
```

---

## Project Structure

```
prepmind-ai/
├── client/                        # React (Vite) frontend
│   ├── index.html
│   ├── vite.config.js             # Path aliases, dev server, build config
│   ├── package.json
│   └── src/
│       ├── main.jsx               # React entry point, root render
│       ├── App.jsx                # Top-level router + providers
│       │
│       ├── routes/                # Application pages
│       │   ├── Home.jsx           # Landing page UI
│       │   ├── Practice.jsx       # Question generation + flow
│       │   └── Tutor.jsx          # Chat tutor mode
│       │
│       ├── components/            # Reusable UI components
│       │   ├── QuestionCard.jsx   # Displays question + answer choices
│       │   ├── Explanation.jsx    # Step-by-step KaTeX explanations
│       │   ├── ApiKeyNoticeGoogle.jsx
│       │   ├── Layout.jsx         # Shared page layout
│       │   ├── Header.jsx
│       │   └── Footer.jsx
│       │
│       ├── lib/                   # Utility functions and API clients
│       │   ├── api.js             # REST client → /api routes
│       │   ├── prompts.js         # Prompt templates for model queries
│       │   └── katex.js           # KaTeX configuration helpers
│       │
│       └── styles/
│           └── tailwind.css       # Global Tailwind configuration
│
├── server/                        # Optional Express API proxy
│   ├── src/
│   │   ├── index.js               # Express app entry point
│   │   ├── routes/
│   │   │   ├── health.js          # GET /health (status check)
│   │   │   └── ai.js              # POST /api/generate|explain|tutor
│   │   └── providers/
│   │       └── googleAi.js        # Handles Google AI Studio API calls
│   │
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example               # Server environment variables
│
├── .gitignore
├── .env.example                   # Root example environment config
├── README.md
└── LICENSE
```

---

## Environment Configuration

### client/.env
Used when the frontend calls the backend proxy on the same origin.

```
VITE_API_BASE=/api
```

### server/.env
Used to define server behavior and API keys.

```
PORT=8080
ALLOWED_ORIGINS=https://prepmind.org,http://localhost:5173
GOOGLE_AI_STUDIO_API_KEY=YOUR_KEY
GOOGLE_AI_STUDIO_MODEL=gemini-2.5-flash
```

**Notes:**
- Do not expose API keys in client-side builds.  
- All model requests should pass through the Express proxy in production.

---

## Build and Development

### Local Development

**Requirements:** Node.js 20 or later.

**Frontend:**
```bash
cd client
npm install
npm run dev
# Runs on http://localhost:5173
```

**Backend:**
```bash
cd server
npm install
npm run dev
# Runs on http://localhost:8080
```

Both services can run simultaneously during development.

---

### Production Build

**Frontend build:**
```bash
cd client
npm ci
npm run build
# Output: client/dist
```

**Backend build:**
```bash
cd server
npm ci
npm run build
npm start
```

You can serve the built frontend statically via Express by adding:

```js
app.use(express.static("client/dist"));
```

This allows a single deployment for both frontend and backend.

---

## Common Issues

| Issue | Cause | Fix |
|-------|--------|-----|
| Duplicate KaTeX imports | Multiple re-imports of `InlineMath`/`BlockMath` | Centralize import/export once |
| CORS errors | Mismatch between `ALLOWED_ORIGINS` and request origin | Update `server/.env` accordingly |
| Port conflicts | Multiple dev servers running | Kill existing processes or change ports |

---

## Privacy and Accessibility

- No user accounts, databases, or analytics tracking  
- Client state stored locally only (session/localStorage)  
- Keyboard-navigable interface  
- Math rendered as text with KaTeX for screen reader compatibility

---

## Contact

**Author:** Jeet Anil  
**Website:** [https://prepmind.org](https://prepmind.org)  
**Issues:** [GitHub Repository](https://github.com/Jeetski2980/PrepMind-Ai/issues)
