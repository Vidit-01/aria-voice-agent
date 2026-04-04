import { useState } from "react";

function relativeTime(dateStr) {
  if (!dateStr) return "—";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min !== 1 ? "s" : ""} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
}

function classBadgeStyle(c) {
  if (!c) return { background: "#f1f5f9", color: "#475569" };
  const key = c.toLowerCase();
  if (key === "hot") return { background: "#fee2e2", color: "#b91c1c" };
  if (key === "warm") return { background: "#fef3c7", color: "#92400e" };
  return { background: "#f1f5f9", color: "#475569" };
}

function courseAndCountries(lead) {
  const parts = [];
  if (lead.target_course) parts.push(lead.target_course);
  if (lead.target_countries?.length) parts.push(lead.target_countries.join(", "));
  const text = parts.join(" → ");
  return text.length > 40 ? text.slice(0, 40) + "…" : text;
}

const LeadRow = ({ lead, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const classification = lead.latest_classification?.toLowerCase();

  return (
    <tr
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: "pointer",
        background: hovered ? "#f5f5f5" : "#fff",
        borderBottom: "1px solid #f1f5f9",
      }}
    >
      {/* NAME */}
      <td style={{ padding: "10px 14px", minWidth: 160 }}>
        <p style={{ fontWeight: 600, color: "#1e293b", margin: 0, fontSize: 13 }}>
          {lead.full_name || "—"}
        </p>
        <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, marginTop: 1 }}>{lead.email}</p>
      </td>

      {/* CONTACT */}
      <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151", whiteSpace: "nowrap" }}>
        {lead.phone || "—"}
      </td>

      {/* COURSE & COUNTRIES */}
      <td
        style={{
          padding: "10px 14px",
          fontSize: 13,
          color: "#374151",
          maxWidth: 200,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={[lead.target_course, lead.target_countries?.join(", ")].filter(Boolean).join(" → ")}
      >
        {courseAndCountries(lead) || "—"}
      </td>

      {/* LEAD SCORE */}
      <td style={{ padding: "10px 14px", whiteSpace: "nowrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
            {lead.latest_lead_score ?? "—"}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 6px",
              borderRadius: 10,
              ...classBadgeStyle(classification),
            }}
          >
            {classification ? classification.toUpperCase() : "COLD"}
          </span>
        </div>
      </td>

      {/* PROFILE COMPLETE — requires pre_analysis not in lead summary */}
      <td style={{ padding: "10px 14px" }}>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
      </td>

      {/* BUDGET READINESS — requires pre_analysis not in lead summary */}
      <td style={{ padding: "10px 14px" }}>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
      </td>

      {/* SESSIONS */}
      <td
        style={{
          padding: "10px 14px",
          fontSize: 13,
          color: lead.total_sessions === 0 ? "#94a3b8" : "#1e293b",
          textAlign: "center",
        }}
      >
        {lead.total_sessions ?? 0}
      </td>

      {/* LAST ACTIVE */}
      <td style={{ padding: "10px 14px", fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
        {relativeTime(lead.last_session_at)}
      </td>

      {/* RESUME — resume_url not in lead summary API response */}
      <td style={{ padding: "10px 14px", textAlign: "center" }}>
        {lead.resume_url ? (
          <span style={{ color: "#16a34a", fontWeight: 700, fontSize: 14 }}>✓</span>
        ) : (
          <span style={{ color: "#d1d5db", fontSize: 13 }}>—</span>
        )}
      </td>
    </tr>
  );
};

export default LeadRow;
