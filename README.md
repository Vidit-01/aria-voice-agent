# Aria - AI-Powered Overseas Education Ecosystem 🎓

![Aria Banner](https://img.shields.io/badge/Aria-Overseas_Education-blue?style=for-the-badge&logo=googlescholar)
![Hackathon Project](https://img.shields.io/badge/Status-Hackathon_Demo-orange?style=for-the-badge)

An end-to-end ecosystem designed to revolutionize overseas education counseling through AI voice agents, smart WhatsApp integration, and a comprehensive admin dashboard.

---

## 🌟 Core Ecosystem Components

### 📱 WhatsApp Bot (Aria) - `whatsaaap/`
A sophisticated WhatsApp-based assistant providing 24/7 counseling and personal productivity tools.
- **Smart Onboarding:** Captures student profiles (Name, Age, Target Countries) automatically.
- **RAG-Powered Chat:** Real-time counseling using a custom Knowledge Base (`fateh_rag_context.md`).
- **Notion Integration:** Seamlessly saves notes, reminders, and to-dos directly to Notion databases.
- **Natural Language Processing:** Features auto-correction, fuzzy intent detection, and smart time inference.
- **Session Summaries:** Automatically generates concise reports of counseling sessions via the `/end` command.

### 🎙️ Live Voice Agent - `codexii/`
A high-performance LiveKit-powered voice service for real-time oral counseling.
- **Real-time Interaction:** Uses Google's Gemini Realtime models for low-latency voice chat.
- **Student Dashboard Integration:** Directly accessible from the web frontend.

### 💻 Web Application - `frontend/` & `backend/`
The central hub for students and admins.
- **Student Portal:** Profile management, document uploads (resume analysis), and voice session history.
- **Admin Command Center:** Lead triage, session reporting, lead scoring, and automated notifications.
- **AI Analysis:** Automated resume pre-analysis and document processing using Gemini.

---

## 📂 Repository Structure

```text
.
├── whatsaaap/             # 📱 WhatsApp Bot Service (FastAPI)
│   ├── main.py            # Webhook handling & state management
│   ├── ai_router.py       # Intent classification & NLP pipeline
│   ├── notion_handler.py  # Notion API integration
│   └── app/data/          # Local state persistence
├── frontend/              # 💻 React + Vite Web Application
│   ├── src/pages/         # Student & Admin dashboards
│   └── src/lib/api.ts     # Centralized API client
├── backend/               # ⚙️ FastAPI Core Backend
│   ├── app/api/           # Auth, Profile, & Admin routes
│   └── app/core/          # Supabase & AI configurations
├── codexii/               # 🎙️ LiveKit Voice Agent Service
│   └── src/agent.py       # Gemini Realtime voice logic
└── fateh_rag_context.md   # 📚 Shared Knowledge Base for RAG
```

---

## 🛠️ Setup & Installation

### Prerequisites
- **Node.js 18+** & **Python 3.10+**
- **Supabase Account** (Auth & Database)
- **LiveKit Cloud/Self-hosted** (Voice Agent)
- **OpenRouter API Key** (WhatsApp LLM)
- **Notion Integration Token** (WhatsApp Productivity)

### 1. WhatsApp Bot Setup (`whatsaaap/`)
```bash
cd whatsaaap
pip install -r requirements.txt # Create this if missing
# Configure .env with OPENROUTER_API_KEY, NOTION_TOKEN, etc.
uvicorn main:app --port 8001 --reload
```

### 2. Backend Core (`backend/`)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```

### 3. Frontend Dashboard (`frontend/`)
```bash
cd frontend
npm install
npm run dev
```

### 4. Voice Agent (`codexii/`)
```bash
cd codexii
uv sync
uv run python src/agent.py dev
```

---

## 🔐 Environment Variables

### WhatsApp Bot (`whatsaaap/.env`)
| Variable | Description |
| :--- | :--- |
| `OPENROUTER_API_KEY` | Key for GPT-4o-mini via OpenRouter |
| `NOTION_TOKEN` | Internal integration token for Notion |
| `NOTION_DB_NOTES` | Database ID for user notes |
| `NOTION_DB_REMINDERS`| Database ID for reminders |
| `NOTION_DB_TODOS` | Database ID for tasks |

### Core Backend (`backend/.env`)
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY` (For resume analysis & reports)
- `FRONTEND_ORIGINS` (CORS configuration)

---

## 🚀 Hackathon Demo Flow
1. **Start WhatsApp Onboarding:** Message the bot to set up your student profile.
2. **Interactive Counseling:** Ask "What are the best universities in Canada for CS?"
3. **Productivity:** Say "Remind me to check my IELTS results tomorrow at 10 AM."
4. **Web Portal:** Log in to the frontend to see your profile and resume analysis.
5. **Voice Session:** Launch the Voice Agent for a real-time mock interview or counseling session.
6. **Admin Audit:** Access `/admin` to view lead scores and session transcripts.

---
## 👥 Team LetUsCook.exe

- [Anay Shah](https://github.com/Anayshah13)
- [Jai Udeshi](https://github.com/jaiudeshi05)
- [Pratham Tiwari](https://github.com/prathamakajordy)
- [Vidit Gupta](https://github.com/Vidit-01)

---
