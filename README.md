# Prep Mind AI

Live site: [prepmind.org](https://prepmind.org)  
Video demonstration:  --------------------------------  
Github:github.com/Jeetski2980/PrepMind-Ai  
License: [MIT](./LICENSE)

## Overview

Prep Mind AI is a free, browser-based test-prep application for SAT, ACT, and AP practice.  
The project is designed for performance, simplicity, and data minimization. The practice interface runs in the browser, and an Express backend handles AI requests through Groq.  
No accounts, databases, or analytics are used.


## Core Technologies
- Frontend:React + Vite + Tailwind CSS  
- Math Rendering: KaTeX  
- Backend: Node.js + Express 
- Model Provider: Groq 
- Build System: Vite for the frontend, Node.js scripts for local development and the API server

## Architecture
AI requests from the frontend flow through the Express backend before reaching the Groq API.

Browser (React UI)
➜
/api/
➜
Groq API
➜
JSON → Rendered Question/Explanation

## Project Structure
```bash
PREPMIND-AI/
├── client/                                # Frontend (React + Vite)
│   ├── components/                        # Shared React UI
│   │   ├── ui/                            # Reusable UI components
│   │   └── Layout.jsx                     # Common page wrapper (header/footer/layout)
│   ├── data/
│   │   └── practice-catalog.js            # SAT, ACT, and AP subjects and topics
│   ├── lib/
│   │   ├── fallback-question-bank.js       # Local question-bank fallback
│   │   ├── local-persistence.js            # Local browser storage helpers
│   │   ├── math-rendering.jsx               # KaTeX rendering helpers
│   │   ├── math-text.js                     # Math text and LaTeX helpers
│   │   └── utils.js                         # Helper/utility functions for frontend
│   ├── pages/                              # Page-level React routes
│   │   ├── About.jsx                       # About page
│   │   ├── Index.jsx                       # Home/landing page
│   │   ├── NotFound.jsx                    # 404 “page not found”
│   │   ├── Practice.jsx                    # Practice question interface
│   │   ├── Terms.jsx                       # Terms page
│   │   └── Tutor.jsx                       # AI Tutor chat interface
│   ├── App.jsx                             # Root React component + router setup
│   └── global.css                          # Global CSS / Tailwind imports
│
├── public/
│   └── question-bank/                      # Local question-bank JSON files
│
├── scripts/
│   ├── dev-local.js                        # Starts the local UI and API server
│   └── generate-fallback-question-banks.js # Generates local question-bank files
│
├── server/
│   ├── middleware/
│   │   └── rateLimit.js                    # API rate and concurrency limits
│   └── index.js                            # Express API and static-file server
│
├── .env.example                            # Example Groq API configuration
├── api.ts                                  # API helper/types
├── index.html                              # Base HTML template (Vite mount point)
├── LICENSE                                 # Open-source license (MIT)
├── package.json                            # Dependencies + npm scripts
├── package-lock.json                       # Exact dependency versions
├── postcss.config.js                       # Tailwind/PostCSS configuration
├── tailwind.config.js                      # Tailwind theme + plugin setup
├── vite.config.js                          # Main Vite config (frontend build)
└── vite.config.server.js                   # Vite config for server build
```
## Environment Configuration
  ### Root .env
  Used to configure the Express server and Groq models. Copy `.env.example` to `.env` and add your Groq API key.
  ```bash
GROQ_API_KEY=YOUR_KEY
GROQ_API_KEY_2=YOUR_SECOND_KEY
GROQ_MODEL_CHAT=openai/gpt-oss-20b
GROQ_MODEL_QA=openai/gpt-oss-20b
  ```
  ### Optional server settings
  Used to configure the server port and allowed request origins.
```bash
PORT=3001
ALLOWED_ORIGINS=https://prepmind.org,http://localhost:5173
```
Notes:
- Do not expose API keys in client-side builds.  

## Build and Development
### Local Development
Requirements: Node.js 20 or later.

Start both services together from the project root with `npm run dev`.

### Production Build

#### Frontend build
```bash
npm ci
npm run build
```
#### Backend build
```bash
npm start
```

The Express server serves the built frontend and API from a single deployment.

## Privacy and Accessibility
- No user accounts, databases, or analytics tracking  
- Client state stored locally only (session/localStorage)  
- Keyboard-navigable interface  
- Math rendered as text with KaTeX for screen reader compatibility

## Contact
Author: Jeet Anil  
Email: support@prepmind.org  
Website: (https://prepmind.org)  
