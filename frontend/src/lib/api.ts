// ============================================================
// Central API module — all backend requests go through here.
// Never make fetch() / WebSocket() calls outside this file.
// ============================================================

const BASE_URL = (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";
const WS_BASE = BASE_URL.replace(/^http/, "ws");

// ---- Token helpers ----

export const getAccessToken = (): string | null => localStorage.getItem("access_token");
export const getRefreshToken = (): string | null => localStorage.getItem("refresh_token");

export const setTokens = (access: string, refresh?: string): void => {
  localStorage.setItem("access_token", access);
  if (refresh) localStorage.setItem("refresh_token", refresh);
};

export const clearTokens = (): void => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
};

// ---- Internal fetch with auto-refresh ----

async function tryRefreshToken(): Promise<boolean> {
  const r = getRefreshToken();
  if (!r) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: r }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.access_token);
    return true;
  } catch {
    return false;
  }
}

async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  isFormData = false
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401) {
    const ok = await tryRefreshToken();
    if (ok) {
      headers["Authorization"] = `Bearer ${getAccessToken()}`;
      res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
    } else {
      clearTokens();
      window.location.href = "/login";
      throw new Error("Session expired");
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw err;
  }

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

// ================================================================
// 1. AUTH
// ================================================================

export interface SignupPayload {
  email: string;
  password: string;
  full_name: string;
  role: "student" | "admin";
}

export interface AuthResponse {
  user_id: string;
  email: string;
  role: string;
  access_token: string;
  token_type: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: string;
  role: string;
}

export interface MeResponse {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
}

export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<void> {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}

export async function refreshToken(refresh: string): Promise<{ access_token: string }> {
  return apiFetch("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refresh }),
  });
}

export async function getMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>("/auth/me");
}

// ================================================================
// 2. PROFILE
// ================================================================

export interface Education {
  level: string;
  field: string;
  institution: string;
  gpa: number | null;
  graduation_year: number | null;
}

export interface Budget {
  annual_tuition_usd: number | null;
  living_expenses_usd: number | null;
  funding_source: string;
  scholarship_applied: boolean;
}

export interface Timeline {
  preferred_intake: string;
  application_deadline_awareness: boolean;
  months_to_start: number | null;
}

export interface TestScores {
  ielts: number | null;
  toefl: number | null;
  gre: number | null;
  gmat: number | null;
  duolingo: number | null;
}

export interface ProfilePayload {
  full_name: string;
  phone: string;
  age: number;
  current_education: Education;
  target_countries: string[];
  target_course: string;
  target_universities: string[];
  budget: Budget;
  timeline: Timeline;
  test_scores: TestScores;
  previous_visa_rejection: boolean;
  preferred_language: string;
}

export interface ProfileResponse extends ProfilePayload {
  user_id: string;
  email: string;
  resume_url?: string;
  created_at: string;
  updated_at: string;
}

export async function submitProfile(
  payload: ProfilePayload
): Promise<{ message: string; user_id: string }> {
  return apiFetch("/profile/submit", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getProfile(userId: string): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>(`/profile/${userId}`);
}

export async function updateProfile(
  userId: string,
  partial: Partial<ProfilePayload>
): Promise<{ message: string }> {
  return apiFetch(`/profile/${userId}`, {
    method: "PUT",
    body: JSON.stringify(partial),
  });
}

export async function uploadResume(
  userId: string,
  file: File
): Promise<{ message: string; resume_url: string }> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch(`/profile/${userId}/resume`, { method: "POST", body: form }, true);
}

export async function getResumeUrl(
  userId: string
): Promise<{ signed_url: string; expires_in_seconds: number }> {
  return apiFetch(`/profile/${userId}/resume`);
}

export interface PreAnalysis {
  profile_completeness_score: number;
  initial_observations: string[];
  gaps_to_probe: string[];
  suggested_focus_areas: string[];
  initial_lead_hint: string;
}

export interface AnalyzeResponse {
  user_id: string;
  pre_analysis: PreAnalysis;
  generated_at: string;
}

export async function analyzeProfile(userId: string): Promise<AnalyzeResponse> {
  return apiFetch<AnalyzeResponse>(`/profile/${userId}/analyze`, { method: "POST" });
}

export async function getPreAnalysis(userId: string): Promise<AnalyzeResponse> {
  return apiFetch<AnalyzeResponse>(`/profile/${userId}/pre-analysis`);
}

// ================================================================
// 3. SESSION — REST
// ================================================================

export interface WebRTCConfig {
  ice_servers: { urls: string }[];
}

export interface CreateSessionResponse {
  session_id: string;
  user_id: string;
  status: string;
  webrtc_config: WebRTCConfig;
  created_at: string;
}

export interface SessionData {
  session_id: string;
  user_id: string;
  status: string;
  language_detected?: string;
  started_at?: string;
  duration_seconds?: number | null;
}

export async function createSession(
  userId: string,
  preferredLanguage = "auto"
): Promise<CreateSessionResponse> {
  return apiFetch<CreateSessionResponse>("/session/create", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, preferred_language: preferredLanguage }),
  });
}

export async function getSession(sessionId: string): Promise<SessionData> {
  return apiFetch<SessionData>(`/session/${sessionId}`);
}

export async function getSessionStatus(sessionId: string): Promise<{ status: string }> {
  return apiFetch<{ status: string }>(`/session/${sessionId}/status`);
}

export async function endSession(
  sessionId: string
): Promise<{ message: string; session_id: string; status: string }> {
  return apiFetch(`/session/${sessionId}/end`, { method: "POST" });
}

// ================================================================
// 4. SESSION — WebSocket
// ================================================================

// Returns a connected WebSocket for WebRTC signaling.
export function openSignalingWS(sessionId: string): WebSocket {
  const token = getAccessToken();
  return new WebSocket(`${WS_BASE}/session/${sessionId}/signal?token=${token}`);
}

// Returns a connected WebSocket for the live audio/transcript stream.
export function openStreamWS(sessionId: string): WebSocket {
  const token = getAccessToken();
  return new WebSocket(`${WS_BASE}/session/${sessionId}/stream?token=${token}`);
}

// ================================================================
// 5. ADMIN — Leads & Sessions
// ================================================================

export interface LeadSummary {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  target_countries: string[];
  target_course: string;
  latest_lead_score: number;
  latest_classification: string;
  total_sessions: number;
  last_session_at: string;
}

export interface LeadsResponse {
  total: number;
  page: number;
  limit: number;
  leads: LeadSummary[];
}

export async function adminGetLeads(params?: {
  page?: number;
  limit?: number;
  classification?: string;
  sort_by?: string;
}): Promise<LeadsResponse> {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.classification) q.set("classification", params.classification);
  if (params?.sort_by) q.set("sort_by", params.sort_by);
  return apiFetch<LeadsResponse>(`/admin/leads?${q}`);
}

export interface SessionSummary {
  session_id: string;
  status: string;
  language_detected?: string;
  duration_seconds?: number;
  lead_score?: number;
  classification?: string;
  summary?: string;
  ended_at?: string;
}

export interface LeadDetailResponse {
  profile: ProfileResponse;
  pre_analysis: PreAnalysis & { generated_at: string };
  sessions: SessionSummary[];
}

export async function adminGetLeadDetail(userId: string): Promise<LeadDetailResponse> {
  return apiFetch<LeadDetailResponse>(`/admin/leads/${userId}`);
}

export async function adminGetLeadSessions(userId: string): Promise<SessionSummary[]> {
  return apiFetch<SessionSummary[]>(`/admin/leads/${userId}/sessions`);
}

export interface AdminSessionItem extends SessionSummary {
  user_id: string;
  full_name: string;
}

export interface AdminSessionsResponse {
  total: number;
  page: number;
  limit: number;
  sessions: AdminSessionItem[];
}

export async function adminGetAllSessions(params?: {
  page?: number;
  limit?: number;
  classification?: string;
  language?: string;
  sort_by?: string;
}): Promise<AdminSessionsResponse> {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.classification) q.set("classification", params.classification);
  if (params?.language) q.set("language", params.language);
  if (params?.sort_by) q.set("sort_by", params.sort_by);
  return apiFetch<AdminSessionsResponse>(`/admin/sessions?${q}`);
}

export interface SessionReport {
  session_id: string;
  user_id: string;
  language_detected: string;
  duration_seconds: number;
  extracted_data: {
    intent_signals: string[];
    financial_signals: string[];
    timeline_signals: string[];
    universities_mentioned: string[];
    courses_mentioned: string[];
    concerns_raised: string[];
  };
  lead_score: {
    total: number;
    breakdown: {
      intent_seriousness: number;
      financial_readiness: number;
      timeline_urgency: number;
    };
    classification: string;
    classification_reason: string;
  };
  sentiment_analysis: {
    overall: string;
    score: number;
    trajectory: string;
    key_emotions: string[];
  };
  recommended_actions: string[];
  summary: string;
  generated_at: string;
}

export async function adminGetSessionReport(sessionId: string): Promise<SessionReport> {
  return apiFetch<SessionReport>(`/admin/sessions/${sessionId}/report`);
}

export interface AnalyticsResponse {
  total_leads: number;
  classification_breakdown: { hot: number; warm: number; cold: number };
  average_lead_score: number;
  sessions_today: number;
  total_sessions: number;
  sentiment_distribution: { positive: number; neutral: number; negative: number };
  top_target_countries: string[];
  avg_session_duration_seconds: number;
  language_distribution: { en: number; hi: number; mr: number };
}

export async function adminGetAnalytics(): Promise<AnalyticsResponse> {
  return apiFetch<AnalyticsResponse>("/admin/analytics");
}

export async function adminNotifyUser(
  userId: string,
  message: string,
  priority: "high" | "medium" | "low"
): Promise<{ message: string }> {
  return apiFetch(`/admin/notify/${userId}`, {
    method: "POST",
    body: JSON.stringify({ message, priority }),
  });
}
