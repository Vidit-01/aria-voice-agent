import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  adminGetAnalytics,
  adminGetLeads,
  type AnalyticsResponse,
  type LeadSummary,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

const classBadge = (c: string) => {
  if (c === "hot") return "bg-red-100 text-red-700";
  if (c === "warm") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
};

const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
    <p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p>
    {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
  </div>
);

const AdminDashboard = () => {
  useDocumentTitle("Admin Dashboard");
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [classification, setClassification] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const LIMIT = 20;

  useEffect(() => {
    adminGetAnalytics()
      .then(setAnalytics)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    adminGetLeads({ page, limit: LIMIT, classification: classification || undefined, sort_by: sortBy })
      .then((r) => {
        setLeads(r.leads);
        setTotal(r.total);
      })
      .catch((err: { detail?: string }) => setError(err?.detail ?? "Failed to load leads."))
      .finally(() => setLoading(false));
  }, [page, classification, sortBy]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f7fbff]">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link to="/">
              <img src="/landing/fateh_logo.png" alt="Fateh" className="h-8 w-auto" />
            </Link>
            <span className="rounded bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">
              Admin
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <h1 className="text-2xl font-extrabold text-slate-900">Overview</h1>

        {error && (
          <div className="my-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Analytics cards */}
        {analytics && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total leads" value={analytics.total_leads} />
            <StatCard
              label="Avg lead score"
              value={analytics.average_lead_score.toFixed(1)}
              sub="out of 100"
            />
            <StatCard
              label="Sessions today"
              value={analytics.sessions_today}
              sub={`${analytics.total_sessions} total`}
            />
            <StatCard
              label="Avg session"
              value={`${Math.round(analytics.avg_session_duration_seconds / 60)} min`}
            />
          </div>
        )}

        {/* Classification & sentiment breakdown */}
        {analytics && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700">Lead classification</h2>
              <div className="mt-4 flex gap-3">
                {(["hot", "warm", "cold"] as const).map((c) => (
                  <div key={c} className={`flex-1 rounded-xl p-3 text-center ${classBadge(c)}`}>
                    <p className="text-2xl font-bold">
                      {analytics.classification_breakdown[c]}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase">{c}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700">Sentiment distribution</h2>
              <div className="mt-4 flex gap-3">
                {Object.entries(analytics.sentiment_distribution).map(([k, v]) => (
                  <div key={k} className="flex-1 rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-2xl font-bold text-slate-800">{v}</p>
                    <p className="mt-1 text-xs font-semibold uppercase text-slate-500">{k}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {analytics && (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700">Top target countries</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {analytics.top_target_countries.map((c) => (
                  <span key={c} className="rounded-full bg-sky-50 px-3 py-1 text-sm font-medium text-sky-800">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-700">Language distribution</h2>
              <div className="mt-3 flex gap-3">
                {Object.entries(analytics.language_distribution).map(([lang, count]) => (
                  <div key={lang} className="flex-1 rounded-xl bg-slate-50 p-3 text-center">
                    <p className="text-xl font-bold text-slate-800">{count}</p>
                    <p className="mt-1 text-xs font-semibold uppercase text-slate-500">{lang}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Leads table */}
        <div className="mt-10">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-slate-900">All Leads</h2>
            <div className="flex items-center gap-3">
              <select
                value={classification}
                onChange={(e) => { setClassification(e.target.value); setPage(1); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
              >
                <option value="">All classifications</option>
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-sky-400 focus:outline-none"
              >
                <option value="created_at">Sort: Newest</option>
                <option value="lead_score">Sort: Lead score</option>
              </select>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="space-y-2 p-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : leads.length === 0 ? (
              <p className="p-8 text-center text-slate-500">No leads found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Course</th>
                      <th className="px-5 py-3">Countries</th>
                      <th className="px-5 py-3">Score</th>
                      <th className="px-5 py-3">Classification</th>
                      <th className="px-5 py-3">Sessions</th>
                      <th className="px-5 py-3">Last session</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {leads.map((lead) => (
                      <tr
                        key={lead.user_id}
                        className="cursor-pointer transition hover:bg-slate-50"
                        onClick={() => navigate(`/admin/leads/${lead.user_id}`)}
                      >
                        <td className="px-5 py-3 font-medium text-slate-900">{lead.full_name}</td>
                        <td className="px-5 py-3 text-slate-600">{lead.email}</td>
                        <td className="px-5 py-3 text-slate-700">{lead.target_course}</td>
                        <td className="px-5 py-3 text-slate-600">
                          {lead.target_countries.join(", ")}
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-900">
                          {lead.latest_lead_score ?? "—"}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${classBadge(
                              lead.latest_classification
                            )}`}
                          >
                            {lead.latest_classification}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{lead.total_sessions}</td>
                        <td className="px-5 py-3 text-slate-500">
                          {lead.last_session_at
                            ? new Date(lead.last_session_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                              })
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-500">
                Page {page} of {totalPages} · {total} total
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 disabled:opacity-40 hover:bg-slate-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 disabled:opacity-40 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
