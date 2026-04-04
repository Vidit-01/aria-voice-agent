# Study Abroad Backend — Full Implementation Prompt

## Project Overview

Build the complete backend for a **Study Abroad Counselling Platform** using **FastAPI**, **Gemini Live (Google Generative AI)**, **WebRTC**, and **Supabase**. The system captures student profile information, conducts a real-time multilingual AI voice+video counselling session, scores the student as a lead, performs sentiment analysis, and stores a concise post-session text summary for counsellor review via an admin dashboard.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend Framework | FastAPI (Python 3.11+) |
| AI Model | Google Gemini Live (gemini-2.0-flash-live or latest live API) |
| Real-Time Transport | WebRTC (audio + video, STUN only) |
| Database | Supabase (PostgreSQL via `supabase-py`) |
| Auth | Supabase Auth (built-in JWT) |
| File Storage | Supabase Storage |
| Async Tasks | FastAPI BackgroundTasks |
| WebSocket | FastAPI native WebSocket |
| Environment | Python `dotenv`, Pydantic v2 settings |

---

## Architecture Overview

```
Browser (Student)
    │
    ├── HTTPS REST ──────────────────────────► FastAPI
    │                                              │
    ├── WS /session/{id}/signal ─────────────► WebRTC Signaling Handler
    │       (SDP offer/answer, ICE)               │
    │                                             ICE (STUN only)
    ├── WS /session/{id}/stream ─────────────► Audio/Video Relay Handler
    │       ▲  audio chunks (PCM)                 │
    │       │  video frames (JPEG)                ├──► Gemini Live (server-side)
    │       │                                     │       │
    │       └── audio response (PCM)  ◄───────────┘       │ STT + LLM + TTS
    │           transcript text chunks ◄───────────────────┘
    │
    └── Admin Dashboard (Counsellor)
            │
            └── HTTPS REST ────────────────► FastAPI ──► Supabase DB
```

### Key Architectural Decisions

1. **Gemini Live is a server-side relay only.** The browser never communicates with Gemini directly. FastAPI receives raw PCM audio (and optionally JPEG video frames) via WebSocket, forwards them to Gemini Live's bidirectional streaming API, and relays Gemini's audio output and real-time text transcripts back to the browser over the same WebSocket.

2. **No TURN server is implemented.** WebRTC uses STUN only (`stun:stun.l.google.com:19302`). This works for most home and mobile networks. Note: In corporate/university NAT environments, some connections may fail. If production reliability demands it, add a TURN server (e.g., coturn or Twilio TURN) later.

3. **No session data is persisted.** Video frames, audio chunks, and transcripts are ephemeral — they exist only in memory during the session. After the session ends, only a short AI-generated text summary is stored in the database. No recordings, no transcripts, no raw conversation data.

4. **Language auto-detection by Gemini.** The backend sets `preferred_language: auto` by default. Gemini detects the student's language from the first 3–5 seconds of speech (Hindi, English, or Marathi) and responds in that language for the entire session. A `language_detected` WebSocket event is emitted to the frontend so the UI can update.

5. **Report generated as a BackgroundTask.** When `POST /session/{id}/end` is called, the API returns immediately and report + summary generation runs asynchronously via FastAPI's `BackgroundTasks`. The admin dashboard polls or checks `status` to know when the report is ready.

6. **Hot lead webhook.** When a session's lead score ≥ 70, the background task automatically fires an internal notification (email or webhook) to counsellors immediately after report generation — without requiring manual dashboard checks.

---

## User Roles

| Role | Description |
|---|---|
| `student` | The lead. Submits profile, uploads resume, participates in voice/video session. |
| `admin` / `counsellor` | Views admin dashboard, all leads, session summaries, scores, and reports. |

Both roles authenticate via **Supabase Auth** (email + password). Role is stored in the `profiles` table and enforced via FastAPI dependency injection on protected routes. Supabase Row Level Security (RLS) is also applied:
- Students can only read/write their own rows.
- Admins/counsellors can read all lead data but cannot modify raw profiles.

---

## Supabase Database Schema

### Table: `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  age INTEGER,
  role TEXT NOT NULL DEFAULT 'student', -- 'student' | 'admin'
  current_education JSONB,
  target_countries TEXT[],
  target_course TEXT,
  target_universities TEXT[],
  budget JSONB,
  timeline JSONB,
  test_scores JSONB,
  previous_visa_rejection BOOLEAN DEFAULT FALSE,
  preferred_language TEXT DEFAULT 'auto',
  resume_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `pre_analyses`
```sql
CREATE TABLE pre_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  profile_completeness_score INTEGER,
  initial_observations JSONB,
  gaps_to_probe JSONB,
  suggested_focus_areas TEXT[],
  initial_lead_hint TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `sessions`
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'created', -- 'created' | 'active' | 'ended' | 'failed'
  language_detected TEXT,
  duration_seconds INTEGER,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table: `session_reports`
```sql
CREATE TABLE session_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  extracted_data JSONB,
  lead_score INTEGER,
  lead_score_breakdown JSONB,
  lead_classification TEXT, -- 'hot' | 'warm' | 'cold'
  classification_reason TEXT,
  sentiment_overall TEXT,
  sentiment_score FLOAT,
  sentiment_trajectory TEXT,
  key_emotions TEXT[],
  recommended_actions TEXT[],
  summary TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Supabase Storage Buckets
| Bucket Name | Purpose | Access |
|---|---|---|
| `resumes` | Student PDF resume uploads | Private (signed URLs) |

---

## API Endpoints

### 🔐 Auth / Login / Signup

#### `POST /auth/signup`
Register a new student account.

**Request Body:**
```json
{
  "email": "riya@example.com",
  "password": "SecurePass123!",
  "full_name": "Riya Sharma",
  "role": "student"
}
```
**Response:**
```json
{
  "user_id": "uuid",
  "email": "riya@example.com",
  "role": "student",
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

---

#### `POST /auth/login`
Authenticate and receive a JWT.

**Request Body:**
```json
{
  "email": "riya@example.com",
  "password": "SecurePass123!"
}
```
**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "user_id": "uuid",
  "role": "student"
}
```

---

#### `POST /auth/logout`
Invalidate current session. Requires `Authorization: Bearer <token>` header.

**Response:** `{ "message": "Logged out successfully" }`

---

#### `POST /auth/refresh`
Refresh an expired access token.

**Request Body:** `{ "refresh_token": "eyJ..." }`

**Response:** `{ "access_token": "eyJ...", "token_type": "bearer" }`

---

#### `GET /auth/me`
Get the current authenticated user's info and role.

**Response:**
```json
{
  "user_id": "uuid",
  "email": "riya@example.com",
  "full_name": "Riya Sharma",
  "role": "student"
}
```

---

### 👤 Profile / Study

#### `POST /profile/submit`
Student submits their full profile for the first time.

**Request Body:**
```json
{
  "full_name": "Riya Sharma",
  "phone": "+919876543210",
  "age": 22,
  "current_education": {
    "level": "Bachelor's",
    "field": "Computer Science",
    "institution": "SPPU",
    "gpa": 8.4,
    "graduation_year": 2024
  },
  "target_countries": ["Germany", "Canada"],
  "target_course": "MS in Data Science",
  "target_universities": ["TU Munich", "University of Toronto"],
  "budget": {
    "annual_tuition_usd": 20000,
    "living_expenses_usd": 12000,
    "funding_source": "education_loan",
    "scholarship_applied": true
  },
  "timeline": {
    "preferred_intake": "Fall 2025",
    "application_deadline_awareness": true,
    "months_to_start": 8
  },
  "test_scores": {
    "ielts": 7.5,
    "toefl": null,
    "gre": 318,
    "gmat": null,
    "duolingo": null
  },
  "previous_visa_rejection": false,
  "preferred_language": "auto"
}
```

**Response:** `{ "message": "Profile saved", "user_id": "uuid" }`

---

#### `GET /profile/{user_id}`
Fetch a student's profile. Students can only fetch their own. Admins can fetch any.

**Response:** Full profile JSON (same shape as submission, plus `resume_url`, `created_at`, `updated_at`).

---

#### `PUT /profile/{user_id}`
Update profile fields. Accepts a partial body (only fields to update).

**Response:** `{ "message": "Profile updated" }`

---

#### `POST /profile/{user_id}/resume`
Upload the student's resume (PDF). Use `multipart/form-data`.

**Form Field:** `file` (PDF, max 5MB)

**Behaviour:**
- Validates file type is `application/pdf`
- Uploads to Supabase Storage bucket `resumes` under path `{user_id}/resume.pdf`
- Stores the signed URL in `profiles.resume_url`

**Response:**
```json
{
  "message": "Resume uploaded successfully",
  "resume_url": "https://your-supabase.storage.co/resumes/uuid/resume.pdf"
}
```

---

#### `GET /profile/{user_id}/resume`
Get a short-lived signed URL for the student's resume.

**Response:** `{ "signed_url": "https://...", "expires_in_seconds": 3600 }`

---

#### `POST /profile/{user_id}/analyze`
Trigger LLM pre-analysis of the student profile before starting a session. Called by the frontend after profile submission (or on session creation). Results are injected into the Gemini Live system prompt automatically when a session starts.

**Behaviour:**
- Reads the student's profile (including resume text if extracted)
- Sends to Gemini with the pre-analysis prompt (see Prompt Design section)
- Stores result in `pre_analyses` table

**Response:**
```json
{
  "user_id": "uuid",
  "pre_analysis": {
    "profile_completeness_score": 82,
    "initial_observations": [
      "Strong academic profile for German universities",
      "Budget aligns with public universities in Germany",
      "GRE score is competitive for Canada"
    ],
    "gaps_to_probe": [
      "Clarity on loan sanction status",
      "SOP readiness",
      "Specific university shortlist rationale",
      "Work experience (if any)"
    ],
    "suggested_focus_areas": ["financial_readiness", "timeline_urgency"],
    "initial_lead_hint": "warm"
  },
  "generated_at": "2025-04-04T10:00:00Z"
}
```

---

#### `GET /profile/{user_id}/pre-analysis`
Fetch the most recent pre-analysis for a student.

**Response:** Same shape as `POST /profile/{user_id}/analyze` response.

---

### 🎙️ Real-Time (WebRTC + Gemini Live)

#### `POST /session/create`
Create a new session record for a student. Automatically fetches the latest pre-analysis and stores it in session context (in-memory or Redis) for Gemini system prompt injection.

**Request Body:**
```json
{
  "user_id": "uuid",
  "preferred_language": "auto"
}
```

**Response:**
```json
{
  "session_id": "uuid",
  "user_id": "uuid",
  "status": "created",
  "webrtc_config": {
    "ice_servers": [
      { "urls": "stun:stun.l.google.com:19302" },
      { "urls": "stun:stun1.l.google.com:19302" }
    ]
  },
  "created_at": "2025-04-04T10:05:00Z"
}
```

---

#### `GET /session/{session_id}`
Get session metadata and current status.

**Response:**
```json
{
  "session_id": "uuid",
  "user_id": "uuid",
  "status": "active",
  "language_detected": "hi",
  "started_at": "2025-04-04T10:06:00Z",
  "duration_seconds": null
}
```

---

#### `GET /session/{session_id}/status`
Lightweight status poll endpoint (for frontend loading states).

**Response:** `{ "status": "created" | "active" | "ended" | "failed" }`

---

#### `WS /session/{session_id}/signal`
WebSocket for WebRTC signaling (SDP offer/answer exchange and ICE candidate negotiation). This WebSocket opens, completes the handshake, and closes. It does not stay open during the session.

**Message Flow:**

Frontend → Backend:
```json
{ "type": "offer", "sdp": "v=0\r\no=..." }
{ "type": "ice_candidate", "candidate": "candidate:...", "sdpMid": "0", "sdpMLineIndex": 0 }
```

Backend → Frontend:
```json
{ "type": "answer", "sdp": "v=0\r\no=..." }
{ "type": "ice_candidate", "candidate": "candidate:...", "sdpMid": "0", "sdpMLineIndex": 0 }
{ "type": "ready" }
{ "type": "error", "message": "Signaling failed" }
```

---

#### `WS /session/{session_id}/stream`
The primary bidirectional WebSocket for the live session. Stays open for the entire duration of the conversation.

**Frontend → Backend (inbound):**
```json
{ "type": "audio_chunk", "data": "<base64-encoded-pcm-16khz-mono>", "timestamp_ms": 1234 }
{ "type": "video_frame", "data": "<base64-jpeg>", "timestamp_ms": 1234 }
{ "type": "session_end_signal" }
```

**Backend → Frontend (outbound):**
```json
{ "type": "audio_response", "data": "<base64-pcm>", "timestamp_ms": 1234 }
{ "type": "transcript_chunk", "speaker": "ai", "text": "नमस्ते! आप किस देश में पढ़ना चाहते हैं?", "language": "hi", "timestamp_ms": 0 }
{ "type": "transcript_chunk", "speaker": "user", "text": "मैं Germany सोच रहा हूँ।", "language": "hi", "timestamp_ms": 4500 }
{ "type": "language_detected", "language": "hi" }
{ "type": "session_status", "status": "active" }
{ "type": "session_status", "status": "ended" }
{ "type": "error", "code": "GEMINI_STREAM_FAIL", "message": "Gemini relay error" }
```

**Internal Relay Logic (FastAPI server-side):**
1. On WebSocket connect, load the student's profile + pre-analysis from in-memory session context.
2. Open a bidirectional Gemini Live stream using the system prompt (see Prompt Design).
3. For each incoming `audio_chunk`: decode base64 → raw PCM → pipe to Gemini input stream.
4. For each incoming `video_frame`: optionally send to Gemini as image context (if Gemini Live supports multimodal input at time of implementation).
5. For each Gemini output event:
   - If audio: encode to base64 → send `audio_response` to frontend.
   - If text (transcript/partial): send `transcript_chunk` to frontend. **Do not persist transcript.**
   - If language detection event: send `language_detected` to frontend.
6. On `session_end_signal` from frontend: close Gemini stream, update session status to `ended`, trigger `BackgroundTask` for report generation.

**Important:** Transcript chunks are sent to the frontend for real-time display only. They are **never written to the database**. All conversation data is ephemeral.

---

#### `POST /session/{session_id}/end`
Explicitly end a session (called by frontend or on WebSocket disconnect). Triggers async background report generation.

**Request Body:** `{}` (empty, session_id in path is sufficient)

**Response:**
```json
{
  "message": "Session ended. Report generation in progress.",
  "session_id": "uuid",
  "status": "ended"
}
```

**Background Task Triggered:**
1. Mark session `ended_at` and compute `duration_seconds`.
2. Call Gemini with post-session report prompt using the in-memory session context accumulated during the call (extracted signals, not raw transcript).
3. Store `session_reports` row in Supabase.
4. If `lead_score >= 70`: fire hot-lead notification (email/webhook to counsellors).
5. Clear in-memory session context.

---

### 📊 Admin Dashboard

> All admin endpoints require the authenticated user to have `role = 'admin'`. Enforce via FastAPI dependency.

#### `GET /admin/leads`
Paginated list of all student leads with key scoring info.

**Query Params:** `page` (default 1), `limit` (default 20), `classification` (filter: hot/warm/cold), `sort_by` (lead_score|created_at)

**Response:**
```json
{
  "total": 148,
  "page": 1,
  "limit": 20,
  "leads": [
    {
      "user_id": "uuid",
      "full_name": "Riya Sharma",
      "email": "riya@example.com",
      "phone": "+919876543210",
      "target_countries": ["Germany", "Canada"],
      "target_course": "MS in Data Science",
      "latest_lead_score": 74,
      "latest_classification": "hot",
      "total_sessions": 2,
      "last_session_at": "2025-04-04T11:00:00Z"
    }
  ]
}
```

---

#### `GET /admin/leads/{user_id}`
Full lead profile + all session summaries for a specific student.

**Response:**
```json
{
  "profile": { "...full profile fields..." },
  "pre_analysis": { "...latest pre_analysis..." },
  "sessions": [
    {
      "session_id": "uuid",
      "status": "ended",
      "language_detected": "hi",
      "duration_seconds": 720,
      "lead_score": 74,
      "classification": "hot",
      "summary": "Student is a strong candidate...",
      "ended_at": "2025-04-04T11:00:00Z"
    }
  ]
}
```

---

#### `GET /admin/leads/{user_id}/sessions`
All sessions for a specific lead (summary cards only).

**Response:** Array of session summary objects (same as `sessions` array above).

---

#### `GET /admin/sessions`
All sessions across all leads, paginated.

**Query Params:** `page`, `limit`, `classification`, `language`, `sort_by`

---

#### `GET /admin/sessions/{session_id}/report`
Full structured report for a specific session.

**Response:**
```json
{
  "session_id": "uuid",
  "user_id": "uuid",
  "language_detected": "hi",
  "duration_seconds": 720,
  "extracted_data": {
    "intent_signals": [
      "Researched specific universities",
      "Has shortlisted 2 countries"
    ],
    "financial_signals": [
      "Education loan in process",
      "Applied for 1 scholarship"
    ],
    "timeline_signals": [
      "Targets Fall 2025",
      "8 months remaining",
      "GRE already completed"
    ],
    "universities_mentioned": ["TU Munich", "University of Toronto"],
    "courses_mentioned": ["MS Data Science"],
    "concerns_raised": [
      "Visa complexity for Germany",
      "Loan approval uncertainty"
    ]
  },
  "lead_score": {
    "total": 74,
    "breakdown": {
      "intent_seriousness": 32,
      "financial_readiness": 22,
      "timeline_urgency": 20
    },
    "classification": "hot",
    "classification_reason": "Score 74 — clear goals, active loan process, near application deadline"
  },
  "sentiment_analysis": {
    "overall": "positive",
    "score": 0.62,
    "trajectory": "improving",
    "key_emotions": ["hopeful", "slightly anxious about finances", "motivated"]
  },
  "recommended_actions": [
    "Immediate callback by counsellor within 2 hours",
    "Share Germany student visa checklist",
    "Connect student with loan partner bank",
    "Send TU Munich application timeline guide"
  ],
  "summary": "Student is a strong MS Data Science candidate targeting Germany and Canada for Fall 2025. Financially semi-ready with a loan in process. Main concern is visa complexity. High intent — treat as priority lead.",
  "generated_at": "2025-04-04T11:00:00Z"
}
```

---

#### `GET /admin/analytics`
Aggregate statistics across all leads and sessions.

**Response:**
```json
{
  "total_leads": 148,
  "classification_breakdown": {
    "hot": 34,
    "warm": 72,
    "cold": 42
  },
  "average_lead_score": 54.3,
  "sessions_today": 12,
  "total_sessions": 310,
  "sentiment_distribution": {
    "positive": 61,
    "neutral": 49,
    "negative": 38
  },
  "top_target_countries": ["Canada", "Germany", "UK", "Australia"],
  "avg_session_duration_seconds": 680,
  "language_distribution": {
    "en": 89,
    "hi": 42,
    "mr": 17
  }
}
```

---

#### `POST /admin/notify/{user_id}`
Manually trigger a counsellor callback notification for a specific lead.

**Request Body:**
```json
{
  "message": "Custom note for counsellor",
  "priority": "high"
}
```

**Response:** `{ "message": "Notification sent" }`

---

### 🗄️ Storage / Retrieval

#### `POST /profile/{user_id}/resume`
*(Documented under Profile section above)*

#### `GET /profile/{user_id}/resume`
*(Documented under Profile section above)*

---

## Prompt Design

### Prompt 1: Profile Pre-Analysis

**Used at:** `POST /profile/{user_id}/analyze`

**System Role:** Gemini Flash (non-live, standard completions API)

```
You are a senior study abroad counsellor AI. You will be given a student's profile JSON.

Your task is to:
1. Calculate a profile completeness score from 0 to 100 based on how many key fields are filled and how specific the information is.
2. Write 2 to 4 concise observations about the student's academic and financial readiness.
3. Identify 3 to 5 specific information gaps that should be probed in the upcoming voice session.
4. Suggest which lead scoring dimensions need the most focus: intent_seriousness, financial_readiness, or timeline_urgency.
5. Give a preliminary lead classification hint: hot, warm, or cold.

If a resume is provided, also consider:
- Work experience and internships
- Research projects
- Extracurricular activities
- Any mentions of specific programs or scholarship applications

Respond ONLY in valid JSON. Do not include any explanation, preamble, or markdown formatting.

Output schema:
{
  "pre_analysis": {
    "profile_completeness_score": <integer 0-100>,
    "initial_observations": [<string>, ...],
    "gaps_to_probe": [<string>, ...],
    "suggested_focus_areas": [<"intent_seriousness"|"financial_readiness"|"timeline_urgency">, ...],
    "initial_lead_hint": <"hot"|"warm"|"cold">
  }
}

Student profile:
{{PROFILE_JSON}}

Resume text (if available):
{{RESUME_TEXT}}
```

---

### Prompt 2: Gemini Live System Prompt (Real-Time Session)

**Used at:** `WS /session/{session_id}/stream` — injected as system context when opening the Gemini Live stream.

```
You are Aria, a warm, professional, and empathetic AI study abroad counsellor at [Company Name].

LANGUAGE BEHAVIOUR:
- Listen to the student's first response.
- Automatically detect whether they are speaking Hindi, English, or Marathi.
- Respond EXCLUSIVELY in that language for the entire conversation.
- Do not switch languages unless the student explicitly requests it.
- Emit a language detection signal after identifying the language.

STUDENT CONTEXT:
The student has already submitted their profile. Here is their information:
{{PROFILE_JSON}}

Key gaps identified from their profile that you must probe during this conversation:
{{GAPS_TO_PROBE}}

YOUR CONVERSATION GOAL:
Have a warm, natural counselling conversation — not a questionnaire. Your job is to:
1. Make the student feel heard and supported.
2. Gather additional information across three dimensions (do not mention these dimensions to the student):
   - Intent Seriousness (40% of lead score): Why this country? Why this course? How long have they been researching? Have they attended webinars or fairs?
   - Financial Readiness (30%): Is funding confirmed? Is a loan sanctioned or just applied? Scholarship status? Parental support?
   - Timeline Urgency (30%): Which intake cycle? Are entrance tests completed? Is the SOP or statement of purpose drafted? Are LORs arranged?
3. Note any concerns, hesitations, or red flags mentioned by the student.
4. Track the student's emotional state throughout the conversation.

CONVERSATION RULES:
- Never ask more than one question at a time.
- Always acknowledge or affirm the student's answer before moving to the next question.
- If the student seems anxious or uncertain, be reassuring before probing further.
- Keep the conversation flowing naturally — use transitions, not bullet-style Q&A.
- If the student goes off-topic, gently guide them back.
- After approximately 10 to 12 minutes, or once you have sufficient information across all three dimensions, begin wrapping up.
- End the conversation by summarising what was discussed and explaining that a counsellor will follow up shortly with personalised guidance.

CRITICAL RULES:
- Do not mention lead scores, classifications, or internal evaluation criteria to the student.
- Do not make promises about admissions or visa approvals.
- Do not give specific university application advice (leave that to human counsellors).
- Do not store or repeat any sensitive information unnecessarily.
```

---

### Prompt 3: Post-Session Report Generation

**Used at:** Called inside the BackgroundTask triggered by `POST /session/{session_id}/end`

**System Role:** Gemini Flash (standard completions API)

**Important:** The prompt does NOT receive a raw transcript. During the session, the FastAPI relay accumulates structured signal notes (intent signals, financial signals, timeline signals, concerns, emotional cues) in an in-memory session context object. These accumulated signals are passed to this prompt.

```
You are an analytical AI assistant for a study abroad counselling company.

You have been given:
1. The student's profile
2. Structured signals extracted during a live counselling session (not a raw transcript)
3. The session metadata (language, duration)

Your task is to generate a complete lead assessment report. Respond ONLY in valid JSON. Do not include any explanation, markdown, or preamble.

SCORING GUIDE:
- Intent Seriousness (0-40): Higher score if student has specific goals, deep research, clear motivation, has attended fairs or webinars.
- Financial Readiness (0-30): Higher score if funding is confirmed or loan is sanctioned. Lower if only exploring or no clarity.
- Timeline Urgency (0-30): Higher score if intake is imminent, tests are done, documents are in progress.
- Total (0-100):
  - 70-100 = hot (immediate counsellor callback)
  - 40-69 = warm (follow up within 24 hours)
  - 0-39 = cold (add to nurture campaign)

Output schema:
{
  "extracted_data": {
    "intent_signals": [<string>, ...],
    "financial_signals": [<string>, ...],
    "timeline_signals": [<string>, ...],
    "universities_mentioned": [<string>, ...],
    "courses_mentioned": [<string>, ...],
    "concerns_raised": [<string>, ...]
  },
  "lead_score": {
    "total": <integer 0-100>,
    "breakdown": {
      "intent_seriousness": <integer 0-40>,
      "financial_readiness": <integer 0-30>,
      "timeline_urgency": <integer 0-30>
    },
    "classification": <"hot"|"warm"|"cold">,
    "classification_reason": <string>
  },
  "sentiment_analysis": {
    "overall": <"positive"|"neutral"|"negative">,
    "score": <float -1.0 to 1.0>,
    "trajectory": <"improving"|"stable"|"declining">,
    "key_emotions": [<string>, ...]
  },
  "recommended_actions": [<string>, ...],
  "summary": <string — 2 to 3 sentences for counsellor review>
}

Student profile:
{{PROFILE_JSON}}

Session metadata:
{{SESSION_METADATA_JSON}}

Accumulated session signals:
{{SESSION_SIGNALS_JSON}}
```

---

## In-Memory Session Context Object

During a live session, the FastAPI server maintains the following object in memory (e.g., a Python dict keyed by `session_id`). This is built up as Gemini responds and as the relay interprets conversation turns. It is the only session-scoped data structure and is cleared after the report is generated.

```python
session_context = {
    "session_id": "uuid",
    "user_id": "uuid",
    "language_detected": None,           # set after first Gemini response
    "started_at": datetime,
    "intent_signals": [],                # list of strings appended during session
    "financial_signals": [],
    "timeline_signals": [],
    "concerns_raised": [],
    "emotional_cues": [],                # e.g. "anxious about finances at 03:20"
    "universities_mentioned": [],
    "courses_mentioned": [],
    "turn_count": 0,
    "profile_json": {},                  # loaded at session start
    "pre_analysis": {},                  # loaded at session start
}
```

**Signal extraction:** As Gemini responds to each turn, the FastAPI relay uses a lightweight Gemini Flash call (or keyword/pattern matching) to extract and append signals to the above lists. This happens silently and does not affect the live audio stream.

Alternatively, a simpler implementation: do the full signal extraction in one batch call at session end, using the in-memory conversation turn count and key topics as context.

---

## Project Structure

```
study-abroad-backend/
├── main.py                        # FastAPI app entry point
├── .env                           # Environment variables
├── requirements.txt
├── app/
│   ├── api/
│   │   ├── auth.py                # /auth/* routes
│   │   ├── profile.py             # /profile/* routes
│   │   ├── session.py             # /session/* routes
│   │   ├── admin.py               # /admin/* routes
│   │   └── storage.py             # storage utility routes
│   ├── core/
│   │   ├── config.py              # Settings via pydantic-settings
│   │   ├── dependencies.py        # Auth dependency injection (get_current_user, require_admin)
│   │   └── supabase_client.py     # Supabase client singleton
│   ├── services/
│   │   ├── gemini_live.py         # Gemini Live bidirectional stream relay
│   │   ├── gemini_flash.py        # Standard Gemini calls (pre-analysis, report generation)
│   │   ├── webrtc_signal.py       # WebRTC SDP/ICE signaling logic
│   │   ├── report_generator.py    # BackgroundTask: report generation + hot-lead notification
│   │   └── session_context.py     # In-memory session context management
│   ├── models/
│   │   ├── auth.py                # Pydantic models for auth
│   │   ├── profile.py             # Pydantic models for profile
│   │   ├── session.py             # Pydantic models for session
│   │   └── report.py              # Pydantic models for report output
│   └── prompts/
│       ├── pre_analysis_prompt.py
│       ├── live_session_system_prompt.py
│       └── report_generation_prompt.py
```

---

## Environment Variables (`.env`)

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# Gemini
GEMINI_API_KEY=your-gemini-api-key
GEMINI_LIVE_MODEL=gemini-2.0-flash-live
GEMINI_FLASH_MODEL=gemini-1.5-flash

# App
APP_SECRET_KEY=your-app-secret
COMPANY_NAME=YourCompanyName
# Do not add for now
HOT_LEAD_WEBHOOK_URL=https://your-notification-service.com/webhook
HOT_LEAD_EMAIL=counsellors@yourcompany.com

# Storage
RESUME_BUCKET=resumes
```

---

## Key Implementation Notes

### Authentication Middleware
Use a FastAPI dependency `get_current_user` that:
1. Reads the `Authorization: Bearer <token>` header.
2. Validates the JWT via Supabase's `auth.get_user(token)`.
3. Fetches the user's `role` from the `profiles` table.
4. Returns a `CurrentUser` object used by all protected routes.

A separate `require_admin` dependency wraps `get_current_user` and raises `HTTP 403` if `role != 'admin'`.

### WebSocket Authentication
For WebSocket endpoints, the JWT cannot be passed in a header (browser WebSocket API limitation). Accept it as a query parameter: `ws://backend/session/{id}/stream?token=eyJ...` and validate it at connection time.

### Gemini Live Integration
Use the `google-generativeai` Python SDK. The Gemini Live API supports a bidirectional streaming interface. The FastAPI stream WebSocket handler should:
- Open an async Gemini Live session using `client.aio.live.connect(model=..., config=...)`
- Run two concurrent async tasks: one to read from the WebSocket and write to Gemini, one to read from Gemini and write to the WebSocket.
- Use `asyncio.gather()` to run both tasks.
- Handle graceful shutdown when either side closes.

### Resume PDF Parsing
When a resume is uploaded, optionally extract text using `pdfplumber` or `pymupdf` and store the extracted text in the `pre_analyses` context (or a `resume_text` column) so Gemini can reference it during pre-analysis. Do not store the raw text permanently if privacy is a concern — extract at analysis time and discard.

### Hot Lead Notification
In the report generation BackgroundTask, after computing `lead_score.total`:
```python
if report.lead_score.total >= 70:
    await send_hot_lead_notification(user_id, report)
```
Implement `send_hot_lead_notification` to POST to `HOT_LEAD_WEBHOOK_URL` or send an email via SMTP/SendGrid with the student's name, score, classification reason, and recommended actions.

### CORS
Configure FastAPI CORS middleware to allow your frontend origin. In development, allow all origins. In production, restrict to your frontend domain.

### Error Handling
Use FastAPI exception handlers for:
- `401 Unauthorized` — missing or invalid token
- `403 Forbidden` — role not permitted
- `404 Not Found` — resource not found in Supabase
- `422 Unprocessable Entity` — Pydantic validation failure
- `500 Internal Server Error` — Gemini API failure, Supabase write failure

For WebSocket errors, send an `error` message type and close the connection with an appropriate close code.

---

## Data Privacy Summary

| Data Type | Stored | Where |
|---|---|---|
| Student profile | ✅ Yes | Supabase `profiles` table |
| Resume PDF | ✅ Yes | Supabase Storage (`resumes` bucket) |
| Pre-analysis result | ✅ Yes | Supabase `pre_analyses` table |
| Session metadata (duration, language, status) | ✅ Yes | Supabase `sessions` table |
| Real-time audio/video stream | ❌ No | Ephemeral, in-memory only |
| Live transcript chunks | ❌ No | Sent to frontend UI only, never persisted |
| Post-session report + summary | ✅ Yes | Supabase `session_reports` table |
| In-memory session context | ❌ No | Cleared after report generation |

---

## Dependencies (`requirements.txt`)

```
fastapi>=0.111.0
uvicorn[standard]>=0.29.0
pydantic>=2.7.0
pydantic-settings>=2.2.0
supabase>=2.4.0
google-generativeai>=0.7.0
python-multipart>=0.0.9
python-jose[cryptography]>=3.3.0
httpx>=0.27.0
python-dotenv>=1.0.0
pdfplumber>=0.11.0
aiofiles>=23.2.1
```
