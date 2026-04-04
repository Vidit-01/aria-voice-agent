import { useState } from "react";
import { adminGetSessionReport } from "@/lib/api";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${month} ${day}, ${year} at ${hours}:${minutes} ${ampm}`;
}

function formatDuration(secs) {
  if (!secs) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function classBadgeStyle(c) {
  if (!c) return { background: "#f1f5f9", color: "#475569" };
  const key = c.toLowerCase();
  if (key === "hot") return { background: "#fee2e2", color: "#b91c1c" };
  if (key === "warm") return { background: "#fef3c7", color: "#92400e" };
  return { background: "#f1f5f9", color: "#475569" };
}

const SessionReportCard = ({ session, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggle = async () => {
    if (!expanded && !report && !error) {
      setLoading(true);
      try {
        const r = await adminGetSessionReport(session.session_id);
        setReport(r);
      } catch {
        setError("Report not yet generated.");
      } finally {
        setLoading(false);
      }
    }
    setExpanded((v) => !v);
  };

  const breakdown = report?.lead_score?.breakdown ?? {};
  const sentiment = report?.sentiment_analysis ?? {};
  const extracted = report?.extracted_data ?? {};

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        marginBottom: 10,
        overflow: "hidden",
      }}
    >
      {/* Header row */}
      <div
        onClick={toggle}
        style={{
          padding: "10px 14px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: expanded ? "#f9fafb" : "#fff",
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13, color: "#1e293b", minWidth: 68 }}>
          Session {index + 1}
        </span>
        <span style={{ fontSize: 12, color: "#64748b" }}>{formatDate(session.ended_at)}</span>
        <span style={{ fontSize: 12, color: "#64748b" }}>{formatDuration(session.duration_seconds)}</span>
        {session.lead_score != null && (
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{session.lead_score}</span>
        )}
        {session.classification && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 12,
              ...classBadgeStyle(session.classification),
            }}
          >
            {session.classification.toUpperCase()}
          </span>
        )}
        {session.summary && (
          <span
            style={{
              flex: 1,
              fontSize: 12,
              color: "#64748b",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
            }}
          >
            {session.summary.slice(0, 90)}…
          </span>
        )}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#94a3b8", flexShrink: 0 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: "16px 14px", borderTop: "1px solid #e5e7eb", background: "#fff" }}>
          {loading && <p style={{ fontSize: 13, color: "#64748b" }}>Loading report…</p>}
          {error && <p style={{ fontSize: 13, color: "#dc2626" }}>{error}</p>}

          {report && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Language */}
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
                Language: <strong>{report.language_detected || "—"}</strong>
              </p>

              {/* Score breakdown */}
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  ["Intent", breakdown.intent_seriousness],
                  ["Financial", breakdown.financial_readiness],
                  ["Timeline", breakdown.timeline_urgency],
                ].map(([label, val]) => (
                  <div
                    key={label}
                    style={{
                      flex: 1,
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      padding: "8px 10px",
                      textAlign: "center",
                    }}
                  >
                    <p style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", margin: 0 }}>
                      {val ?? "—"}
                    </p>
                    <p style={{ fontSize: 11, color: "#64748b", margin: "3px 0 0" }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Sentiment */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Sentiment</p>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  {sentiment.overall && (
                    <span style={{ fontSize: 13, color: "#1e293b", textTransform: "capitalize" }}>
                      {sentiment.overall}
                    </span>
                  )}
                  {sentiment.score != null && (
                    <span style={{ fontSize: 12, color: "#64748b" }}>({sentiment.score})</span>
                  )}
                  {sentiment.trajectory && (
                    <span style={{ fontSize: 12, color: "#64748b" }}>· {sentiment.trajectory}</span>
                  )}
                  {(sentiment.key_emotions ?? []).map((e) => (
                    <span
                      key={e}
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        background: "#f1f5f9",
                        borderRadius: 12,
                        color: "#475569",
                      }}
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>

              {/* Extracted signals */}
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>
                  Extracted Signals
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[
                    ["Intent", extracted.intent_signals],
                    ["Financial", extracted.financial_signals],
                    ["Timeline", extracted.timeline_signals],
                    ["Concerns", extracted.concerns_raised],
                  ].map(([label, items]) => (
                    <div key={label}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
                        {label}
                      </p>
                      <ul style={{ margin: 0, paddingLeft: 16 }}>
                        {(items ?? []).length > 0 ? (
                          (items ?? []).map((item, i) => (
                            <li key={i} style={{ fontSize: 12, color: "#374151", marginBottom: 2 }}>
                              {item}
                            </li>
                          ))
                        ) : (
                          <li style={{ fontSize: 12, color: "#94a3b8" }}>None</li>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended actions */}
              {(report.recommended_actions ?? []).length > 0 && (
                <div style={{ background: "#eff6ff", padding: 12, borderRadius: 6 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#1d4ed8", marginBottom: 6 }}>
                    Recommended Actions
                  </p>
                  <ol style={{ margin: 0, paddingLeft: 20 }}>
                    {report.recommended_actions.map((action, i) => (
                      <li key={i} style={{ fontSize: 12, color: "#1e40af", marginBottom: 4 }}>
                        {action}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Summary */}
              {report.summary && (
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Summary</p>
                  <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: 0 }}>
                    {report.summary}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SessionReportCard;
