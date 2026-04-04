import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { adminGetSessionReport, type SessionReport } from "@/lib/api";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const classBadge = (c?: string) => {
  if (c === "hot") return "bg-red-100 text-red-700 border-red-200";
  if (c === "warm") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
};

const ScoreBar = ({ label, value, max = 40 }: { label: string; value: number; max?: number }) => (
  <div>
    <div className="flex justify-between text-xs text-slate-500">
      <span>{label}</span>
      <span>{value} / {max}</span>
    </div>
    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-sky-500 transition-all"
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  </div>
);

const Section = ({ title, items, color = "sky" }: { title: string; items: string[]; color?: "sky" | "amber" | "red" | "slate" }) => {
  const dot = {
    sky: "bg-sky-400",
    amber: "bg-amber-400",
    red: "bg-red-400",
    slate: "bg-slate-400",
  }[color];
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">None noted.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {items.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-slate-700">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const AdminSessionReport = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  useDocumentTitle("Session Report");

  const [report, setReport] = useState<SessionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) return;
    adminGetSessionReport(sessionId)
      .then(setReport)
      .catch((err: { detail?: string }) =>
        setError(err?.detail ?? "Report not found or still generating.")
      )
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7fbff]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f7fbff] text-center">
        <p className="text-slate-600">{error || "Report not found."}</p>
        <p className="text-sm text-slate-400">
          The report may still be generating. Try again in a moment.
        </p>
        <Link to="/admin" className="text-sky-600 underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const { lead_score, sentiment_analysis, extracted_data, recommended_actions } = report;

  return (
    <div className="min-h-screen bg-[#f7fbff]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3">
          <Link
            to={`/admin/leads/${report.user_id}`}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            ← Lead detail
          </Link>
          <span className="text-sm font-semibold text-slate-700">Session Report</span>
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${classBadge(lead_score.classification)}`}
          >
            {lead_score.classification.toUpperCase()}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-6">
        {/* Meta */}
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm text-center">
            <p className="text-xs text-slate-500">Duration</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {Math.round(report.duration_seconds / 60)} min
            </p>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm text-center">
            <p className="text-xs text-slate-500">Language</p>
            <p className="mt-1 text-lg font-bold text-slate-900 uppercase">
              {report.language_detected}
            </p>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm text-center">
            <p className="text-xs text-slate-500">Lead score</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{lead_score.total} / 100</p>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-sm text-center">
            <p className="text-xs text-slate-500">Generated</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {new Date(report.generated_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        {/* Summary */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-900">Summary</h2>
          <p className="mt-3 leading-relaxed text-slate-700">{report.summary}</p>
        </section>

        {/* Lead score breakdown */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Lead Score</h2>
            <span
              className={`rounded-full border px-3 py-1 text-sm font-bold ${classBadge(lead_score.classification)}`}
            >
              {lead_score.total} — {lead_score.classification}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-500">{lead_score.classification_reason}</p>
          <div className="mt-5 space-y-4">
            <ScoreBar
              label="Intent & seriousness"
              value={lead_score.breakdown.intent_seriousness}
              max={40}
            />
            <ScoreBar
              label="Financial readiness"
              value={lead_score.breakdown.financial_readiness}
              max={30}
            />
            <ScoreBar
              label="Timeline urgency"
              value={lead_score.breakdown.timeline_urgency}
              max={30}
            />
          </div>
        </section>

        {/* Sentiment */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-900">Sentiment Analysis</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-xs text-slate-500">Overall</p>
              <p className="mt-1 text-lg font-bold capitalize text-slate-900">
                {sentiment_analysis.overall}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-xs text-slate-500">Score</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {(sentiment_analysis.score * 100).toFixed(0)}%
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-xs text-slate-500">Trajectory</p>
              <p className="mt-1 text-lg font-bold capitalize text-slate-900">
                {sentiment_analysis.trajectory}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Key emotions
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sentiment_analysis.key_emotions.map((e) => (
                <span key={e} className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800">
                  {e}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Extracted data */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-900">Extracted Signals</h2>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <Section title="Intent signals" items={extracted_data.intent_signals} color="sky" />
            <Section title="Financial signals" items={extracted_data.financial_signals} color="amber" />
            <Section title="Timeline signals" items={extracted_data.timeline_signals} color="slate" />
            <Section title="Concerns raised" items={extracted_data.concerns_raised} color="red" />
          </div>
          {(extracted_data.universities_mentioned.length > 0 ||
            extracted_data.courses_mentioned.length > 0) && (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <Section title="Universities mentioned" items={extracted_data.universities_mentioned} color="slate" />
              <Section title="Courses mentioned" items={extracted_data.courses_mentioned} color="slate" />
            </div>
          )}
        </section>

        {/* Recommended actions */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-slate-900">Recommended Actions</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-slate-700 marker:font-semibold marker:text-sky-600">
            {recommended_actions.map((a) => (
              <li key={a} className="text-sm leading-relaxed">
                {a}
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
};

export default AdminSessionReport;
