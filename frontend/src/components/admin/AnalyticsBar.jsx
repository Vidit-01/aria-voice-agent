function formatDuration(secs) {
  if (!secs) return "0m 0s";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

const s = {
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    background: "#fff",
    padding: "12px 16px",
  },
  label: {
    fontSize: 11,
    color: "#94a3b8",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    margin: 0,
    marginBottom: 4,
  },
  value: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1e293b",
    margin: 0,
    lineHeight: 1.2,
  },
};

const AnalyticsBar = ({ analytics }) => {
  const cb = analytics.classification_breakdown ?? {};
  const sd = analytics.sentiment_distribution ?? {};
  const ld = analytics.language_distribution ?? {};

  return (
    <div>
      {/* Row 1: Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
        <div style={s.card}>
          <p style={s.label}>Total Leads</p>
          <p style={s.value}>{analytics.total_leads}</p>
        </div>
        <div style={s.card}>
          <p style={s.label}>Avg Lead Score</p>
          <p style={s.value}>
            {(analytics.average_lead_score ?? 0).toFixed(1)}
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}> / 100</span>
          </p>
        </div>
        <div style={s.card}>
          <p style={s.label}>Sessions Today</p>
          <p style={s.value}>{analytics.sessions_today}</p>
        </div>
        <div style={s.card}>
          <p style={s.label}>Total Sessions</p>
          <p style={s.value}>{analytics.total_sessions}</p>
        </div>
        <div style={s.card}>
          <p style={s.label}>Avg Session</p>
          <p style={s.value}>{formatDuration(analytics.avg_session_duration_seconds)}</p>
        </div>
      </div>

      {/* Row 2: Classification | Sentiment | Language */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 10 }}>
        {/* Lead Classification */}
        <div style={{ ...s.card, padding: "10px 16px" }}>
          <p style={{ ...s.label, marginBottom: 8 }}>Lead Classification</p>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {[
              ["Hot",  cb.hot  ?? 0, "#fee2e2", "#b91c1c"],
              ["Warm", cb.warm ?? 0, "#fef3c7", "#92400e"],
              ["Cold", cb.cold ?? 0, "#f1f5f9", "#475569"],
            ].map(([label, count, bg, color]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: bg, color }}>
                  {label}
                </span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment Distribution */}
        <div style={{ ...s.card, padding: "10px 16px" }}>
          <p style={{ ...s.label, marginBottom: 8 }}>Sentiment</p>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {Object.entries(sd).map(([key, count]) => (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 11, color: "#64748b", textTransform: "capitalize" }}>{key}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Language Distribution */}
        <div style={{ ...s.card, padding: "10px 16px" }}>
          <p style={{ ...s.label, marginBottom: 8 }}>Language</p>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {Object.entries(ld).length > 0 ? (
              Object.entries(ld).map(([lang, count]) => (
                <div key={lang} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>
                    {lang}
                  </span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#1e293b" }}>{count}</span>
                </div>
              ))
            ) : (
              <span style={{ fontSize: 13, color: "#94a3b8" }}>No data</span>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Top Target Countries */}
      {analytics.top_target_countries?.length > 0 && (
        <div style={{ ...s.card, marginTop: 10, padding: "10px 16px" }}>
          <p style={{ ...s.label, marginBottom: 8 }}>Top Target Countries</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {analytics.top_target_countries.map((c) => (
              <span
                key={c}
                style={{
                  fontSize: 12,
                  padding: "2px 10px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 4,
                  color: "#374151",
                  background: "#fafafa",
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsBar;
