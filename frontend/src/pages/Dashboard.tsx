import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import {
  getProfile,
  getPreAnalysis,
  createSession,
  getSession,
  getResumeUrl,
  uploadResume,
  analyzeProfile,
  type ProfileResponse,
  type PreAnalysis,
  type SessionData,
} from "@/lib/api";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

// ---- Local session store helpers ----
// Since the API has no "list my sessions" endpoint for students, we keep track locally.

interface StoredSession {
  session_id: string;
  created_at: string;
  status: string;
  duration_seconds?: number | null;
  language_detected?: string;
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

// ---- Classification badge ----

const classBadge = (c?: string) => {
  if (c === "hot") return "bg-red-100 text-red-700";
  if (c === "warm") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
};

// ---- Dashboard ----

const Dashboard = () => {
  useDocumentTitle("Dashboard");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [analysis, setAnalysis] = useState<{ pre_analysis: PreAnalysis; generated_at: string } | null>(null);
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [sessionStarting, setSessionStarting] = useState(false);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;
    setProfileLoading(true);
    try {
      const [p, a] = await Promise.allSettled([
        getProfile(user.user_id),
        getPreAnalysis(user.user_id),
      ]);
      if (p.status === "fulfilled") setProfile(p.value);
      if (a.status === "fulfilled") setAnalysis(a.value);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  // Refresh stored sessions against the backend to pick up status changes
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

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user) return;
    const stored = getStoredSessions(user.user_id);
    setSessions(stored);
    refreshSessions();
  }, [user, refreshSessions]);

  const startSession = async () => {
    if (!user) return;
    setSessionStarting(true);
    setError("");
    try {
      const res = await createSession(user.user_id, profile?.preferred_language ?? "auto");
      // Persist so the session appears in the list
      pushSession(user.user_id, {
        session_id: res.session_id,
        created_at: res.created_at,
        status: "created",
      });
      navigate(`/session/${res.session_id}`, {
        state: { webrtc_config: res.webrtc_config },
      });
    } catch (err: unknown) {
      const msg = (err as { detail?: string })?.detail ?? "Could not start session.";
      setError(msg);
    } finally {
      setSessionStarting(false);
    }
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
      // Trigger fresh analysis with the new resume
      await analyzeProfile(user.user_id);
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
      setResumeUrl(signed_url);
      window.open(signed_url, "_blank");
    } catch {
      setError("Could not fetch resume URL.");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const hintColor = (hint?: string) => {
    if (hint === "hot") return "text-red-600";
    if (hint === "warm") return "text-amber-600";
    return "text-slate-500";
  };

  const completeness = analysis?.pre_analysis.profile_completeness_score ?? null;

  return (
    <div className="min-h-screen bg-[#f7fbff]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/">
            <img src="/landing/fateh_logo.png" alt="Fateh" className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-600 md:block">{user?.full_name}</span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {error && (
          <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Welcome + Start session */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Welcome back, {user?.full_name?.split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {profile
                ? "Your profile is active. Start a session to talk with our AI counselor."
                : "Complete your profile to unlock AI counseling sessions."}
            </p>
          </div>
          {profile ? (
            <button
              onClick={startSession}
              disabled={sessionStarting}
              className="shrink-0 rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700 disabled:opacity-60"
            >
              {sessionStarting ? "Starting…" : "Start AI Session"}
            </button>
          ) : (
            <Link
              to="/register"
              className="shrink-0 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
            >
              Complete Profile
            </Link>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column: profile + resume */}
          <div className="space-y-6 lg:col-span-1">
            {/* Profile card */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">Profile</h2>
                {profile && (
                  <Link
                    to="/register"
                    className="text-xs font-medium text-sky-600 hover:underline"
                  >
                    Edit
                  </Link>
                )}
              </div>
              {profileLoading ? (
                <div className="mt-4 h-24 animate-pulse rounded-xl bg-slate-100" />
              ) : profile ? (
                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  <li>
                    <span className="font-medium">Course:</span> {profile.target_course}
                  </li>
                  <li>
                    <span className="font-medium">Countries:</span>{" "}
                    {profile.target_countries.join(", ")}
                  </li>
                  <li>
                    <span className="font-medium">Intake:</span>{" "}
                    {profile.timeline.preferred_intake}
                  </li>
                  <li>
                    <span className="font-medium">Education:</span>{" "}
                    {profile.current_education.level} — {profile.current_education.field}
                  </li>
                  {profile.current_education.gpa && (
                    <li>
                      <span className="font-medium">GPA:</span>{" "}
                      {profile.current_education.gpa}
                    </li>
                  )}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No profile yet.</p>
              )}
            </section>

            {/* Resume card */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">Resume</h2>
              {profile?.resume_url ? (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-slate-500">Resume on file.</p>
                  <button
                    onClick={viewResume}
                    className="w-full rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100"
                  >
                    View Resume
                  </button>
                  <label className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-300 px-3 py-2 text-center text-xs font-medium text-slate-500 hover:bg-slate-50">
                    {resumeUploading ? "Uploading…" : "Replace Resume (PDF)"}
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleResumeUpload}
                      className="hidden"
                      disabled={resumeUploading}
                    />
                  </label>
                </div>
              ) : (
                <div className="mt-3">
                  <label className="block w-full cursor-pointer rounded-xl border border-dashed border-slate-300 px-4 py-5 text-center hover:bg-slate-50">
                    <span className="text-sm font-medium text-slate-700">
                      {resumeUploading ? "Uploading…" : "Upload Resume (PDF)"}
                    </span>
                    <br />
                    <span className="text-xs text-slate-400">Max 5 MB</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={handleResumeUpload}
                      className="hidden"
                      disabled={resumeUploading}
                    />
                  </label>
                </div>
              )}
              {/* suppress unused warning */}
              {resumeUrl && <span className="hidden">{resumeUrl}</span>}
            </section>
          </div>

          {/* Right column: pre-analysis + sessions */}
          <div className="space-y-6 lg:col-span-2">
            {/* Pre-analysis card */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">AI Pre-Analysis</h2>
                {analysis && (
                  <span className={`text-xs font-semibold uppercase ${hintColor(analysis.pre_analysis.initial_lead_hint)}`}>
                    {analysis.pre_analysis.initial_lead_hint} lead
                  </span>
                )}
              </div>
              {profileLoading ? (
                <div className="mt-4 h-32 animate-pulse rounded-xl bg-slate-100" />
              ) : analysis ? (
                <div className="mt-4 space-y-4">
                  {/* Profile completeness bar */}
                  <div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Profile completeness</span>
                      <span>{completeness}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-all"
                        style={{ width: `${completeness}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Observations
                      </p>
                      <ul className="mt-2 space-y-1">
                        {analysis.pre_analysis.initial_observations.map((o) => (
                          <li key={o} className="flex gap-2 text-sm text-slate-700">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                            {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Things to prepare
                      </p>
                      <ul className="mt-2 space-y-1">
                        {analysis.pre_analysis.gaps_to_probe.map((g) => (
                          <li key={g} className="flex gap-2 text-sm text-slate-700">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                            {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : profile ? (
                <div className="mt-4">
                  <p className="text-sm text-slate-500">No analysis yet.</p>
                  <button
                    onClick={async () => {
                      if (!user) return;
                      try {
                        const a = await analyzeProfile(user.user_id);
                        setAnalysis(a);
                      } catch {
                        setError("Analysis failed. Try again.");
                      }
                    }}
                    className="mt-3 rounded-lg bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
                  >
                    Run Analysis
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">Complete your profile first.</p>
              )}
            </section>

            {/* Sessions list */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">My Sessions</h2>
              {sessions.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  No sessions yet. Click <strong>Start AI Session</strong> above to begin.
                </p>
              ) : (
                <ul className="mt-4 divide-y divide-slate-100">
                  {sessions.map((s) => (
                    <li key={s.session_id} className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {new Date(s.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {s.duration_seconds
                              ? `${Math.round(s.duration_seconds / 60)} min`
                              : "–"}
                            {s.language_detected ? ` · ${s.language_detected.toUpperCase()}` : ""}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${classBadge(undefined)} ${
                            s.status === "active"
                              ? "bg-green-100 text-green-700"
                              : s.status === "ended"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-sky-100 text-sky-600"
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
