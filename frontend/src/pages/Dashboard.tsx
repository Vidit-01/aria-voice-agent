import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import AppSidebar from "@/components/AppSidebar";
import {
  getProfile,
  getPreAnalysis,
  getSession,
  getResumeUrl,
  uploadResume,
  waitForValidPreAnalysis,
  type ProfileResponse,
  type PreAnalysis,
} from "@/lib/api";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface StoredSession {
  session_id: string;
  created_at: string;
  status: string;
  duration_seconds?: number | null;
  language_detected?: string;
}

interface UniversitySuggestion {
  name: string;
  country: string;
}

const EUROPE_UNIVERSITIES: UniversitySuggestion[] = [
  { name: "University of Amsterdam", country: "Netherlands" },
  { name: "TU Delft", country: "Netherlands" },
  { name: "KU Leuven", country: "Belgium" },
  { name: "University of Copenhagen", country: "Denmark" },
  { name: "LMU Munich", country: "Germany" },
  { name: "Heidelberg University", country: "Germany" },
  { name: "ETH Zurich", country: "Switzerland" },
  { name: "EPFL", country: "Switzerland" },
  { name: "Trinity College Dublin", country: "Ireland" },
  { name: "University College Dublin", country: "Ireland" },
  { name: "University of Edinburgh", country: "United Kingdom" },
  { name: "University of Manchester", country: "United Kingdom" },
  { name: "Sorbonne University", country: "France" },
  { name: "Sciences Po", country: "France" },
  { name: "University of Bologna", country: "Italy" },
  { name: "Sapienza University of Rome", country: "Italy" },
  { name: "University of Barcelona", country: "Spain" },
  { name: "Autonomous University of Madrid", country: "Spain" },
];

function pickRandomUniversities(targetCountries: string[] | undefined, count = 3): UniversitySuggestion[] {
  const normalizedTargets = (targetCountries ?? []).map((c) => c.trim().toLowerCase());
  const pool = normalizedTargets.length
    ? EUROPE_UNIVERSITIES.filter((u) => normalizedTargets.includes(u.country.toLowerCase()))
    : EUROPE_UNIVERSITIES;
  const base = pool.length > 0 ? pool : EUROPE_UNIVERSITIES;

  const selected: UniversitySuggestion[] = [];
  const used = new Set<number>();
  while (selected.length < Math.min(count, base.length)) {
    const idx = Math.floor(Math.random() * base.length);
    if (used.has(idx)) continue;
    used.add(idx);
    selected.push(base[idx]);
  }
  return selected;
}

function getStoredSessions(userId: string): StoredSession[] {
  try {
    return JSON.parse(localStorage.getItem(`sessions_${userId}`) || "[]") as StoredSession[];
  } catch {
    return [];
  }
}

function saveStoredSessions(userId: string, sessions: StoredSession[]): void {
  localStorage.setItem(`sessions_${userId}`, JSON.stringify(sessions));
}

function pushSession(userId: string, s: StoredSession): void {
  const existing = getStoredSessions(userId).filter((x) => x.session_id !== s.session_id);
  saveStoredSessions(userId, [s, ...existing]);
}

const Dashboard = () => {
  useDocumentTitle("Dashboard");
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [analysis, setAnalysis] = useState<{ pre_analysis: PreAnalysis; generated_at: string } | null>(null);
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [suggestedUniversities, setSuggestedUniversities] = useState<UniversitySuggestion[]>([]);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;
    setProfileLoading(true);
    setSuggestedUniversities(pickRandomUniversities(undefined));
    try {
      const [p, a] = await Promise.allSettled([getProfile(user.user_id), getPreAnalysis(user.user_id)]);
      if (p.status === "fulfilled") {
        setProfile(p.value);
        setSuggestedUniversities(pickRandomUniversities(p.value.target_countries));
      }
      if (a.status === "fulfilled") setAnalysis(a.value);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  const refreshSessions = useCallback(async () => {
    if (!user) return;
    const stored = getStoredSessions(user.user_id);
    if (stored.length === 0) return;
    const updated = await Promise.all(
      stored.map(async (s) => {
        try {
          const live = await getSession(s.session_id);
          return {
            ...s,
            status: live.status,
            duration_seconds: live.duration_seconds,
            language_detected: live.language_detected,
          };
        } catch {
          return s;
        }
      })
    );
    saveStoredSessions(user.user_id, updated);
    setSessions(updated);
  }, [user]);

  const pollForAnalysis = useCallback(async () => {
    if (!user) return;
    setAnalysisLoading(true);
    try {
      const latest = await waitForValidPreAnalysis(user.user_id, {
        attempts: 25,
        intervalMs: 1500,
        requireFresh: true,
      });
      setAnalysis(latest);
    } catch (err: unknown) {
      const msg = (err as { detail?: string })?.detail ?? "AI analysis failed. Please retry.";
      setError(msg);
    } finally {
      setAnalysisLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user) return;
    const stored = getStoredSessions(user.user_id);
    setSessions(stored);
    refreshSessions();
  }, [user, refreshSessions]);

  useEffect(() => {
    if (!profileLoading && profile && !analysis && !analysisLoading) {
      pollForAnalysis();
    }
  }, [profileLoading, profile, analysis, analysisLoading, pollForAnalysis]);

  const startSession = () => {
    navigate("/voice-agent");
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      return;
    }
    setResumeUploading(true);
    setError("");
    try {
      await uploadResume(user.user_id, file);
      await pollForAnalysis();
      await loadData();
    } catch (err: unknown) {
      const msg = (err as { detail?: string })?.detail ?? "Upload failed.";
      setError(msg);
    } finally {
      setResumeUploading(false);
    }
  };

  const viewResume = async () => {
    if (!user) return;
    try {
      const { signed_url } = await getResumeUrl(user.user_id);
      window.open(signed_url, "_blank");
    } catch {
      setError("Could not fetch resume URL.");
    }
  };

  const completeness = analysis?.pre_analysis.profile_completeness_score ?? null;

  // Animate progress bar on mount
  const [barWidth, setBarWidth] = useState(0);
  const barRef = useRef(false);
  useEffect(() => {
    if (completeness !== null && !barRef.current) {
      barRef.current = true;
      const t = setTimeout(() => setBarWidth(completeness), 120);
      return () => clearTimeout(t);
    }
  }, [completeness]);

  const statusColor = (s: string) => {
    if (s === "ended" || s === "completed") return { bg: "#ecfdf5", color: "#059669" };
    if (s === "active") return { bg: "#eff6ff", color: "#2563eb" };
    return { bg: "#f8fafc", color: "#64748b" };
  };

  return (
    <div
      className="min-h-screen pt-20"
      style={{ background: "#F8FAFC" }}
    >
      {/* Main content ? offset by sidebar on md+ */}
      <main className="md:ml-[260px] px-6 py-10">
        {/* Fixed aside (desktop) + mobile overlay + mobile trigger ? all in one component */}
        <AppSidebar />

        <div className="mx-auto max-w-5xl">

        {/* ?? Error ?? */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            <span className="text-base">?</span> {error}
          </div>
        )}

        {/* ?? Page header ?? */}
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
              Student Dashboard
            </p>
            <h1
              className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl"
              style={{ letterSpacing: "-0.02em" }}
            >
              Welcome back,{" "}
              <span
                style={{ background: "linear-gradient(90deg,#2F80ED,#56CCF2)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
              >
                {user?.full_name?.split(" ")[0]}
              </span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {profile
                ? "Your profile is active. Start a session to talk with our AI counselor."
                : "Complete your profile to unlock AI counseling sessions."}
            </p>
          </div>

          {profile ? (
            <button
              onClick={startSession}
              className="group shrink-0 transition-all duration-300"
              style={{
                background: "linear-gradient(135deg,#2F80ED,#56CCF2)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.9rem",
                letterSpacing: "0.02em",
                padding: "13px 32px",
                borderRadius: "9999px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 8px 24px rgba(47,128,237,0.35)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 14px 32px rgba(47,128,237,0.5)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 8px 24px rgba(47,128,237,0.35)";
                (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
              }}
            >
              ? Start Session
            </button>
          ) : (
            <Link
              to="/register"
              className="shrink-0 transition-all duration-300"
              style={{
                background: "#0f172a",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.9rem",
                padding: "13px 32px",
                borderRadius: "9999px",
                textDecoration: "none",
                boxShadow: "0 8px 24px rgba(15,23,42,0.25)",
                display: "inline-block",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(0)"; }}
            >
              Complete Profile ?
            </Link>
          )}
        </div>

        {/* ?? Main 2-column grid ?? */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* ?? LEFT: Profile + Resume ?? */}
          <div className="flex flex-col gap-6 lg:col-span-1">

            {/* Profile card */}
            <section
              className="transition-all duration-300"
              style={{ background: "#fff", borderRadius: 20, border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", padding: "26px 28px" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.05)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#e0f0ff,#c7e8ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>??</div>
                  <h2 style={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.01em", color: "#0f172a" }}>Profile</h2>
                </div>
                {profile && (
                  <Link to="/register" style={{ fontSize: "0.75rem", fontWeight: 600, color: "#2F80ED", textDecoration: "none", padding: "4px 10px", borderRadius: 8, background: "#eff6ff" }}>
                    Edit
                  </Link>
                )}
              </div>

              {profileLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded-xl bg-slate-100" />)}
                </div>
              ) : profile ? (
                <div className="space-y-3">
                  {[
                    { label: "Course", value: profile.target_course },
                    { label: "Countries", value: profile.target_countries.join(", ") },
                    { label: "Intake", value: profile.timeline?.preferred_intake },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ background: "#F8FAFC", borderRadius: 12, padding: "10px 14px" }}>
                      <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 2 }}>{label}</p>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e293b", lineHeight: 1.4 }}>{value || "?"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: "0.875rem", color: "#94a3b8", marginTop: 8 }}>No profile yet.</p>
              )}
            </section>

            {/* Resume card */}
            <section
              className="transition-all duration-300"
              style={{ background: "#fff", borderRadius: 20, border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", padding: "26px 28px" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.05)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              <div className="mb-5 flex items-center gap-2.5">
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#f0fdf4,#dcfce7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>??</div>
                <h2 style={{ fontWeight: 700, fontSize: "0.95rem", letterSpacing: "0.01em", color: "#0f172a" }}>Resume</h2>
              </div>

              {profile?.resume_url ? (
                <div className="space-y-2.5">
                  <button
                    onClick={viewResume}
                    style={{ width: "100%", padding: "10px 16px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#eff6ff,#dbeafe)", color: "#2563eb", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", letterSpacing: "0.02em" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg,#dbeafe,#bfdbfe)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "linear-gradient(135deg,#eff6ff,#dbeafe)"; }}
                  >
                    View Resume ?
                  </button>
                  <label
                    style={{ display: "block", width: "100%", padding: "10px 16px", borderRadius: 12, border: "2px dashed #cbd5e1", textAlign: "center", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: "#94a3b8", boxSizing: "border-box" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLLabelElement).style.borderColor = "#93c5fd"; (e.currentTarget as HTMLLabelElement).style.color = "#3b82f6"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLLabelElement).style.borderColor = "#cbd5e1"; (e.currentTarget as HTMLLabelElement).style.color = "#94a3b8"; }}
                  >
                    {resumeUploading ? "Uploading?" : "Replace PDF"}
                    <input type="file" accept="application/pdf" onChange={handleResumeUpload} className="hidden" disabled={resumeUploading} />
                  </label>
                </div>
              ) : (
                <label
                  style={{ display: "block", width: "100%", padding: "28px 20px", borderRadius: 14, border: "2px dashed #cbd5e1", textAlign: "center", cursor: "pointer", boxSizing: "border-box", transition: "all 0.2s ease" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLLabelElement).style.borderColor = "#93c5fd"; (e.currentTarget as HTMLLabelElement).style.background = "#f0f9ff"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLLabelElement).style.borderColor = "#cbd5e1"; (e.currentTarget as HTMLLabelElement).style.background = "transparent"; }}
                >
                  <div style={{ fontSize: "1.6rem", marginBottom: 8 }}>??</div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#475569" }}>{resumeUploading ? "Uploading?" : "Upload Resume"}</p>
                  <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 3 }}>PDF only</p>
                  <input type="file" accept="application/pdf" onChange={handleResumeUpload} className="hidden" disabled={resumeUploading} />
                </label>
              )}
            </section>
          </div>

          {/* ?? RIGHT: AI Pre-Analysis (dominant) ?? */}
          <section
            className="lg:col-span-2 transition-all duration-300"
            style={{
              background: "#fff",
              borderRadius: 20,
              border: "1px solid rgba(0,0,0,0.05)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              padding: "32px 36px",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.05)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
          >
            {/* Card header */}
            <div className="mb-7 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#e0f0ff,#c7e8ff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>??</div>
                <div>
                  <h2 style={{ fontWeight: 800, fontSize: "1.05rem", color: "#0f172a", letterSpacing: "-0.01em" }}>AI Pre-Analysis</h2>
                  <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 1 }}>Powered by Gemini</p>
                </div>
              </div>
              {analysis && (
                <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#059669", background: "#ecfdf5", padding: "4px 10px", borderRadius: 20 }}>
                  Ready
                </span>
              )}
            </div>

            {profileLoading ? (
              <div className="space-y-4">
                <div className="h-4 animate-pulse rounded-full bg-slate-100" />
                <div className="h-3 animate-pulse rounded-full bg-slate-100 w-4/5" />
                {[1,2,3].map(i => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
              </div>
            ) : analysisLoading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 0", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", border: "3px solid #e0f0ff", borderTopColor: "#2F80ED", animation: "spin 0.9s linear infinite" }} />
                <p style={{ fontWeight: 600, color: "#2F80ED", fontSize: "0.9rem" }}>Analysing your profile?</p>
                <p style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Waiting for Gemini to return insights</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : analysis ? (
              <>
                {/* Progress bar */}
                <div className="mb-7">
                  <div className="mb-2 flex items-center justify-between">
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#64748b" }}>Profile Completeness</span>
                    <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#2F80ED", letterSpacing: "-0.02em" }}>{completeness}%</span>
                  </div>
                  <div style={{ height: 10, borderRadius: 9999, background: "#f1f5f9", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 9999,
                        background: "linear-gradient(90deg,#2F80ED,#56CCF2)",
                        width: `${barWidth}%`,
                        transition: "width 1.1s cubic-bezier(0.4,0,0.2,1)",
                        boxShadow: "0 0 12px rgba(47,128,237,0.3)",
                      }}
                    />
                  </div>
                </div>

                {/* Observations */}
                <div className="space-y-2.5 mb-7">
                  {analysis.pre_analysis.initial_observations.map((o, i) => (
                    <div
                      key={i}
                      style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#F8FAFC", borderRadius: 14, padding: "12px 16px", border: "1px solid rgba(0,0,0,0.04)" }}
                    >
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "linear-gradient(135deg,#2F80ED,#56CCF2)", flexShrink: 0, marginTop: 5 }} />
                      <span style={{ fontSize: "0.875rem", color: "#334155", lineHeight: 1.6 }}>{o}</span>
                    </div>
                  ))}
                </div>

                {/* University suggestions */}
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: 22 }}>
                  <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 12 }}>
                    Europe Suggestions
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {suggestedUniversities.map((u) => (
                      <span
                        key={`${u.name}-${u.country}`}
                        style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 9999, padding: "5px 14px", fontSize: "0.78rem", fontWeight: 600, color: "#0369a1" }}
                      >
                        {u.name} ? {u.country}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : profile ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", gap: 12 }}>
                <span style={{ fontSize: "2.5rem" }}>??</span>
                <p style={{ fontWeight: 600, color: "#334155", fontSize: "0.95rem" }}>Analysis not generated yet</p>
                <button
                  onClick={pollForAnalysis}
                  style={{ marginTop: 6, padding: "10px 24px", borderRadius: 9999, border: "none", background: "linear-gradient(135deg,#2F80ED,#56CCF2)", color: "#fff", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", boxShadow: "0 6px 18px rgba(47,128,237,0.3)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 10px 24px rgba(47,128,237,0.45)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 18px rgba(47,128,237,0.3)"; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)"; }}
                >
                  Run Analysis
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", gap: 8 }}>
                <span style={{ fontSize: "2.5rem" }}>??</span>
                <p style={{ fontSize: "0.9rem", color: "#94a3b8" }}>Complete your profile first to unlock AI analysis.</p>
              </div>
            )}
          </section>
        </div>

        {/* ?? Sessions (full width below) ?? */}
        <section
          className="mt-6 transition-all duration-300"
          style={{ background: "#fff", borderRadius: 20, border: "1px solid rgba(0,0,0,0.05)", boxShadow: "0 4px 20px rgba(0,0,0,0.05)", padding: "28px 32px" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 28px rgba(0,0,0,0.08)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.05)"; }}
        >
          <div className="mb-5 flex items-center gap-3">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#faf5ff,#ede9fe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>??</div>
            <h2 style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a", letterSpacing: "-0.01em" }}>My Sessions</h2>
          </div>

          {sessions.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 0", gap: 10 }}>
              <span style={{ fontSize: "2rem" }}>??</span>
              <p style={{ fontSize: "0.875rem", color: "#94a3b8", fontWeight: 500 }}>No sessions yet.</p>
              <p style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>Click "Start Session" to begin your first AI counseling session.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((s) => {
                const badge = statusColor(s.status);
                return (
                  <div
                    key={s.session_id}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 14, border: "1px solid rgba(0,0,0,0.05)", transition: "background 0.2s ease" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f8fafc"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#f0f9ff,#e0f2fe)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>??</div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: "0.875rem", color: "#1e293b" }}>
                          {new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        {s.language_detected && (
                          <p style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: 1 }}>Lang: {s.language_detected}</p>
                        )}
                      </div>
                    </div>
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 9999, background: badge.bg, color: badge.color }}>
                      {s.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        </div>{/* /max-w-5xl */}
      </main>
    </div>
  );
};

export default Dashboard;
