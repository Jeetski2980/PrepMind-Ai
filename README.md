Prep Mind AI

Live site: https://prepmind.org

Video demonstration: https://<your-video-link> ← replace with the public HTTPS URL used in your application
Repository license: MIT (or update to your license)

Prep Mind AI is a free, browser-based test-prep tool for SAT, ACT, and AP practice. The app is designed for universal access. It intentionally avoids user accounts and databases to minimize cost and data collection. Questions and stepwise explanations are produced on demand via LLM APIs, with KaTeX rendering for readable math.

Why it matters

Paid prep tools can exclude students. Prep Mind AI focuses on equity: no sign-ups, no student data stored server-side, fast startup on school Chromebooks, and zero recurring platform fees so the app can remain free.

Key capabilities

SAT Math and Reading & Writing practice with instant generation

Step-by-step solution explanations with KaTeX typesetting

“AI Tutor” chat mode for follow-up questions

Works without accounts and without a database

Mobile-responsive UI and low bandwidth footprint

Architecture at a glance

Frontend: React + Vite + Tailwind CSS. KaTeX for math layout.

Backend (optional but recommended): Node.js + Express proxy to call model providers securely and handle CORS. No persistence layer.

Models: Configurable provider boundary supporting Google AI Studio (Gemini). The same interface can support Together AI or others.

Hosting: Render. Static site for the frontend. Separate Render web service for the API proxy, or a single service that serves both.

Request flow

Browser UI → /api/* (Express proxy) → Provider SDK/HTTPS (Google AI Studio) → normalized JSON → UI renders question, choices, and explanation.

Project structure (compact)
prepmind-ai/
├─ client/                    # React application (Vite)
│  ├─ index.html
│  ├─ vite.config.*          # Aliases, dev server, build
│  ├─ package.json
│  └─ src/
│     ├─ main.*              # App bootstrap
│     ├─ App.*               # Routes and providers
│     ├─ routes/
│     │  ├─ Home.*           # Landing page
│     │  ├─ Practice.*       # Question flow
│     │  └─ Tutor.*          # AI Tutor chat
│     ├─ components/
│     │  ├─ QuestionCard.*   # Stem, choices, selection
│     │  ├─ Explanation.*    # Step-by-step + KaTeX
│     │  └─ Header|Footer.*
│     ├─ lib/
│     │  ├─ api.*            # REST client to /api
│     │  ├─ prompts.*        # Prompt templates
│     │  └─ katex.*          # KaTeX utilities
│     └─ styles/tailwind.css
│
├─ server/                   # Optional API proxy (Render Web Service)
│  ├─ src/
│  │  ├─ index.*             # Express app
│  │  ├─ routes/
│  │  │  ├─ health.*         # GET /health
│  │  │  └─ ai.*             # POST /api/generate|explain|tutor
│  │  └─ providers/
│  │     └─ googleAi.*       # Google AI Studio calls
│  ├─ package.json
│  └─ tsconfig.json
│
├─ .env.example              # Example environment variables
├─ README.md
└─ LICENSE

Environment configuration

client/.env (when calling a same-origin proxy):

VITE_API_BASE=/api


server/.env

PORT=8080
ALLOWED_ORIGINS=https://prepmind.org,http://localhost:5173

GOOGLE_AI_STUDIO_API_KEY=...
GOOGLE_AI_STUDIO_MODEL=gemini-1.5-flash   # or gemini-pro


Security note: API keys must not be exposed in client code. In production, route model traffic through the Express proxy.

Deployment notes (Render)

Split services

Static Site: client/

Build: npm ci && npm run build

Publish directory: dist

Web Service: server/

Build: npm ci && npm run build

Start: npm start

Set ALLOWED_ORIGINS on the server to include the static site and https://prepmind.org.

Single service

Build the client during the server build and serve client/dist via express.static. Simplifies CORS and domain configuration.

Custom domain

Point prepmind.org to Render and attach it to the service(s). Enable TLS in Render.

Local development (VS Code)

Prerequisites: Node 20+.
Terminal A:

cd client
npm install
cp ../.env.example .env  # if needed
npm run dev   # http://localhost:5173


Terminal B:

cd server
npm install
cp ../.env.example .env
npm run dev   # http://localhost:8080


Common issues

KaTeX duplicate symbol: import InlineMath and BlockMath once and re-export to avoid multiple declarations.

CORS: ensure ALLOWED_ORIGINS matches your dev host and production domain.

Port collisions: change Vite port or stop previous dev servers.

Privacy and accessibility

No server-side storage. No accounts, no profiles, no analytics database.

Client state is ephemeral and may use localStorage for session continuity only.

Interface is keyboard-navigable. Color choices maintain sufficient contrast. Math is rendered as real text through KaTeX for screen readers that support MathML fallbacks.

Roadmap

AP Chemistry and Pre-Calculus modules

Offline practice mode

Voice tutoring and multilingual UI

Contact

Primary author: Jeet Anil
Project site: https://prepmind.org

Issues and feedback: open a GitHub issue in this repository
