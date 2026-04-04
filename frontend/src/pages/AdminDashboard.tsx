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

// @ts-expect-error — JSX components without type declarations
import AnalyticsBar from "@/components/admin/AnalyticsBar";
// @ts-expect-error — JSX components without type declarations
import LeadsTable from "@/components/admin/LeadsTable";
// @ts-expect-error — JSX components without type declarations
import LeadDetailPanel from "@/components/admin/LeadDetailPanel";

const LIMIT = 20;

const CLASS_ORDER: Record<string, number> = { hot: 0, warm: 1, cold: 2 };

function sortLeads(leads: LeadSummary[], sortBy: string): LeadSummary[] {
  if (sortBy === "newest") {
    return [...leads].sort((a, b) => {
      const ta = a.last_session_at ? new Date(a.last_session_at).getTime() : 0;
      const tb = b.last_session_at ? new Date(b.last_session_at).getTime() : 0;
      return tb - ta;
    });
  }
  if (sortBy === "score") {
    return [...leads].sort(
      (a, b) => (b.latest_lead_score ?? 0) - (a.latest_lead_score ?? 0)
    );
  }
  // Default — urgency: classification priority → lead_score desc → last_session_at desc
  return [...leads].sort((a, b) => {
    const ca = CLASS_ORDER[a.latest_classification?.toLowerCase() ?? ""] ?? 2;
    const cb = CLASS_ORDER[b.latest_classification?.toLowerCase() ?? ""] ?? 2;
    if (ca !== cb) return ca - cb;
    const sd = (b.latest_lead_score ?? 0) - (a.latest_lead_score ?? 0);
    if (sd !== 0) return sd;
    const ta = a.last_session_at ? new Date(a.last_session_at).getTime() : 0;
    const tb = b.last_session_at ? new Date(b.last_session_at).getTime() : 0;
    return tb - ta;
  });
}

const AdminDashboard = () => {
  useDocumentTitle("Admin Dashboard");
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [classification, setClassification] = useState("");
  const [sortBy, setSortBy] = useState("urgency");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLead, setSelectedLead] = useState<LeadSummary | null>(null);

  useEffect(() => {
    adminGetAnalytics()
      .then(setAnalytics)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    // Map UI sort to API sort param
    const apiSort = sortBy === "score" ? "lead_score" : "created_at";
    adminGetLeads({
      page,
      limit: LIMIT,
      classification: classification || undefined,
      sort_by: apiSort,
    })
      .then((r: { leads: LeadSummary[]; total: number }) => {
        setLeads(sortLeads(r.leads, sortBy));
        setTotal(r.total);
      })
      .catch((err: { detail?: string }) =>
        setError(err?.detail ?? "Failed to load leads.")
      )
      .finally(() => setLoading(false));
  }, [page, classification, sortBy]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafafa",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* ── Header ── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 50,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link to="/">
              <img
                src="/landing/fateh_logo.png"
                alt="Fateh"
                style={{ height: 26 }}
              />
            </Link>
            <span
              style={{
                background: "#1e293b",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 4,
                letterSpacing: "0.04em",
              }}
            >
              ADMIN
            </span>
            <span
              style={{ fontSize: 14, fontWeight: 600, color: "#64748b" }}
            >
              Dashboard
            </span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: "5px 14px",
              border: "1px solid #e5e7eb",
              borderRadius: 6,
              fontSize: 13,
              cursor: "pointer",
              background: "#fff",
              color: "#374151",
            }}
          >
            Log out
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "24px",
        }}
      >
        {error && (
          <p style={{ color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
            {error}
          </p>
        )}

        {/* Analytics Bar */}
        {analytics ? (
          <AnalyticsBar analytics={analytics} />
        ) : (
          <div
            style={{
              height: 130,
              background: "#f1f5f9",
              borderRadius: 8,
              marginBottom: 10,
            }}
          />
        )}

        {/* Leads Table */}
        <div style={{ marginTop: 28 }}>
          <LeadsTable
            leads={leads}
            loading={loading}
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={(p: number) => setPage(p)}
            onFilterChange={(c: string) => {
              setClassification(c);
              setPage(1);
            }}
            onSortChange={(s: string) => {
              setSortBy(s);
              setPage(1);
            }}
            onRowClick={(lead: LeadSummary) => setSelectedLead(lead)}
          />
        </div>
      </main>

      {/* Lead Detail Panel */}
      {selectedLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
