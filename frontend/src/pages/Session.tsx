import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { endSession, getSession, getSessionStatus, type SessionData } from "@/lib/api";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

type SessionPhase = "loading" | "active" | "ending" | "ended" | "error";

const Session = () => {
  useDocumentTitle("Session");
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<SessionPhase>("loading");
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) {
      setPhase("error");
      setError("Missing session id.");
      return;
    }

    let mounted = true;
    const load = async () => {
      try {
        const data = await getSession(sessionId);
        if (!mounted) return;
        setSessionData(data);
        setPhase(data.status === "ended" ? "ended" : "active");
      } catch {
        if (!mounted) return;
        setPhase("error");
        setError("Could not load session.");
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [sessionId]);

  const handleEnd = async () => {
    if (!sessionId) return;
    setPhase("ending");
    setError("");

    try {
      await endSession(sessionId);

      for (let i = 0; i < 20; i += 1) {
        await new Promise((r) => setTimeout(r, 1200));
        try {
          const s = await getSessionStatus(sessionId);
          if (s.status === "ended" || s.status === "failed") {
            setPhase("ended");
            return;
          }
        } catch {
          break;
        }
      }

      setPhase("ended");
    } catch {
      setPhase("error");
      setError("Could not end session.");
    }
  };

  if (phase === "ended") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7fbff] px-4 text-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
          <h1 className="text-2xl font-extrabold text-slate-900">Session complete</h1>
          <p className="mt-2 text-slate-600">Your session has ended and report generation is in progress.</p>
          <Link
            to="/dashboard"
            className="mt-6 inline-block rounded-xl bg-sky-600 px-8 py-3 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
        <div className="flex items-center gap-3">
          <img src="/landing/fateh_logo.png" alt="Fateh" className="h-7 w-auto brightness-200" />
          <span className="text-sm font-semibold text-slate-300">Session</span>
        </div>
        <span className="text-sm text-slate-400">
          {phase === "loading" && "Loading..."}
          {phase === "active" && "Active"}
          {phase === "ending" && "Ending..."}
          {phase === "error" && "Error"}
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          {error ? (
            <p className="text-sm text-red-300">{error}</p>
          ) : (
            <>
              <h2 className="text-lg font-semibold">REST Session Mode</h2>
              <p className="mt-2 text-sm text-slate-300">
                Live WebSocket streaming has been moved out of this backend. This page now uses REST-only session controls.
              </p>
              {sessionData && (
                <div className="mt-4 space-y-1 text-sm text-slate-300">
                  <p>Session ID: {sessionData.session_id}</p>
                  <p>Status: {sessionData.status}</p>
                  <p>User ID: {sessionData.user_id}</p>
                </div>
              )}
            </>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleEnd}
              disabled={phase !== "active"}
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {phase === "ending" ? "Ending..." : "End Session"}
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              Back
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Session;
