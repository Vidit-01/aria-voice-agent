import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  adminGetLeadDetail,
  adminNotifyUser,
  type LeadDetailResponse,
} from "@/lib/api";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const classBadge = (c?: string) => {
  if (c === "hot") return "bg-red-100 text-red-700";
  if (c === "warm") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
};

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
    <dd className="mt-1 text-sm text-slate-800">{value ?? "—"}</dd>
  </div>
);

const AdminLeadDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  useDocumentTitle("Lead Detail");

  const [data, setData] = useState<LeadDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Notify modal
  const [showNotify, setShowNotify] = useState(false);
  const [notifyMsg, setNotifyMsg] = useState("");
  const [notifyPriority, setNotifyPriority] = useState<"high" | "medium" | "low">("high");
  const [notifySending, setNotifySending] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    adminGetLeadDetail(userId)
      .then(setData)
      .catch((err: { detail?: string }) => setError(err?.detail ?? "Failed to load lead."))
      .finally(() => setLoading(false));
  }, [userId]);

  const sendNotification = async () => {
    if (!userId || !notifyMsg) return;
    setNotifySending(true);
    try {
      await adminNotifyUser(userId, notifyMsg, notifyPriority);
      setNotifySuccess(true);
      setTimeout(() => {
        setShowNotify(false);
        setNotifySuccess(false);
        setNotifyMsg("");
      }, 2000);
    } catch {
      setError("Notification failed.");
    } finally {
      setNotifySending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7fbff]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f7fbff] text-center">
        <p className="text-slate-600">{error || "Lead not found."}</p>
        <Link to="/admin" className="text-sky-600 underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const { profile, pre_analysis, sessions } = data;
  const { current_education: edu, budget, timeline, test_scores: tests } = profile;

  return (
    <div className="min-h-screen bg-[#f7fbff]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin")}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              ← All leads
            </button>
            <span className="text-sm font-semibold text-slate-700">{profile.full_name}</span>
          </div>
          <button
            onClick={() => setShowNotify(true)}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Notify Counselor
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile */}
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Profile</h2>
              <dl className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Email" value={profile.email} />
                <Field label="Phone" value={profile.phone} />
                <Field label="Age" value={profile.age} />
                <Field label="Target course" value={profile.target_course} />
                <Field label="Target countries" value={profile.target_countries.join(", ")} />
                <Field label="Target universities" value={profile.target_universities?.join(", ")} />
              </dl>

              <h3 className="mt-6 text-sm font-bold text-slate-800">Education</h3>
              <dl className="mt-2 grid gap-4 md:grid-cols-2">
                <Field label="Level" value={edu.level} />
                <Field label="Field" value={edu.field} />
                <Field label="Institution" value={edu.institution} />
                <Field label="GPA" value={edu.gpa} />
                <Field label="Graduation year" value={edu.graduation_year} />
              </dl>

              <h3 className="mt-6 text-sm font-bold text-slate-800">Budget</h3>
              <dl className="mt-2 grid gap-4 md:grid-cols-2">
                <Field label="Annual tuition (USD)" value={budget.annual_tuition_usd ? `$${budget.annual_tuition_usd.toLocaleString()}` : "—"} />
                <Field label="Living expenses (USD)" value={budget.living_expenses_usd ? `$${budget.living_expenses_usd.toLocaleString()}` : "—"} />
                <Field label="Funding source" value={budget.funding_source?.replace(/_/g, " ")} />
                <Field label="Scholarship applied" value={budget.scholarship_applied ? "Yes" : "No"} />
              </dl>

              <h3 className="mt-6 text-sm font-bold text-slate-800">Timeline</h3>
              <dl className="mt-2 grid gap-4 md:grid-cols-3">
                <Field label="Preferred intake" value={timeline.preferred_intake} />
                <Field label="Months to start" value={timeline.months_to_start} />
                <Field label="Deadline aware" value={timeline.application_deadline_awareness ? "Yes" : "No"} />
              </dl>

              <h3 className="mt-6 text-sm font-bold text-slate-800">Test scores</h3>
              <dl className="mt-2 grid gap-4 md:grid-cols-5">
                {Object.entries(tests).filter(([, v]) => v !== null).map(([k, v]) => (
                  <Field key={k} label={k.toUpperCase()} value={String(v)} />
                ))}
                {Object.values(tests).every((v) => v === null) && (
                  <dd className="col-span-5 text-sm text-slate-400">No test scores on file.</dd>
                )}
              </dl>

              <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="text-slate-500">Previous visa rejection:</span>
                <span className={profile.previous_visa_rejection ? "text-red-600 font-semibold" : "text-green-600"}>
                  {profile.previous_visa_rejection ? "Yes" : "No"}
                </span>
                <span className="ml-4 text-slate-500">Language:</span>
                <span className="font-medium text-slate-800">
                  {profile.preferred_language === "auto" ? "Auto" : profile.preferred_language.toUpperCase()}
                </span>
              </div>

              {profile.resume_url && (
                <div className="mt-4">
                  <a
                    href={profile.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-lg bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-100"
                  >
                    View Resume →
                  </a>
                </div>
              )}
            </section>

            {/* Sessions */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Sessions</h2>
              {sessions.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No sessions yet.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {sessions.map((s) => (
                    <li key={s.session_id} className="rounded-xl border border-slate-100 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${classBadge(s.classification)}`}
                            >
                              {s.classification ?? s.status}
                            </span>
                            {s.lead_score !== undefined && (
                              <span className="text-sm font-semibold text-slate-800">
                                Score: {s.lead_score}
                              </span>
                            )}
                            {s.language_detected && (
                              <span className="text-xs text-slate-400">
                                {s.language_detected.toUpperCase()}
                              </span>
                            )}
                          </div>
                          {s.summary && (
                            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{s.summary}</p>
                          )}
                          <p className="mt-2 text-xs text-slate-400">
                            {s.duration_seconds
                              ? `${Math.round(s.duration_seconds / 60)} min · `
                              : ""}
                            {s.ended_at
                              ? new Date(s.ended_at).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "In progress"}
                          </p>
                        </div>
                        {s.status === "ended" && (
                          <Link
                            to={`/admin/sessions/${s.session_id}/report`}
                            className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                          >
                            Full report
                          </Link>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* Pre-analysis sidebar */}
          <div className="space-y-6 lg:col-span-1">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">AI Pre-Analysis</h2>
              {pre_analysis ? (
                <>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Profile completeness</span>
                      <span>{pre_analysis.profile_completeness_score}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{ width: `${pre_analysis.profile_completeness_score}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Lead hint
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold ${classBadge(pre_analysis.initial_lead_hint)}`}
                    >
                      {pre_analysis.initial_lead_hint}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Observations
                    </p>
                    <ul className="mt-2 space-y-1">
                      {pre_analysis.initial_observations.map((o) => (
                        <li key={o} className="flex gap-2 text-sm text-slate-700">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Gaps to probe
                    </p>
                    <ul className="mt-2 space-y-1">
                      {pre_analysis.gaps_to_probe.map((g) => (
                        <li key={g} className="flex gap-2 text-sm text-slate-700">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="mt-4 text-xs text-slate-400">
                    Generated {new Date(pre_analysis.generated_at).toLocaleDateString("en-IN")}
                  </p>
                </>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No pre-analysis available.</p>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Notify modal */}
      {showNotify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900">Notify Counselor</h2>
            <p className="mt-1 text-sm text-slate-600">
              Trigger a callback notification for{" "}
              <strong>{profile.full_name}</strong>.
            </p>
            {notifySuccess ? (
              <p className="mt-4 text-center text-sm font-semibold text-green-600">
                Notification sent!
              </p>
            ) : (
              <>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700">Message</label>
                  <textarea
                    rows={3}
                    value={notifyMsg}
                    onChange={(e) => setNotifyMsg(e.target.value)}
                    className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    placeholder="e.g. Student called asking about visa documents"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-700">Priority</label>
                  <select
                    value={notifyPriority}
                    onChange={(e) => setNotifyPriority(e.target.value as "high" | "medium" | "low")}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => setShowNotify(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={sendNotification}
                    disabled={notifySending || !notifyMsg}
                    className="flex-1 rounded-xl bg-sky-600 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    {notifySending ? "Sending…" : "Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeadDetail;
