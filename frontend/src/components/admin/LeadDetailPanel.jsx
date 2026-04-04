import { useState, useEffect } from "react";
import { adminGetLeadDetail, getResumeUrl } from "@/lib/api";
import SessionReportCard from "./SessionReportCard";
import NotifyForm from "./NotifyForm";

// ---- Helpers ----

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

function classBadgeStyle(c) {
  if (!c) return { background: "#f1f5f9", color: "#475569" };
  const key = String(c).toLowerCase();
  if (key === "hot") return { background: "#fee2e2", color: "#b91c1c" };
  if (key === "warm") return { background: "#fef3c7", color: "#92400e" };
  return { background: "#f1f5f9", color: "#475569" };
}

function usd(val) {
  if (val == null) return "—";
  return `$${Number(val).toLocaleString()}`;
}

// ---- Sub-components ----

const SectionTitle = ({ children }) => (
  <p
    style={{
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.07em",
      color: "#94a3b8",
      margin: "0 0 12px",
    }}
  >
    {children}
  </p>
);

const Divider = () => (
  <div style={{ height: 1, background: "#f1f5f9", margin: "20px 0" }} />
);

const Field = ({ label, value }) => (
  <div>
    <p style={{ fontSize: 10, color: "#94a3b8", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {label}
    </p>
    <p style={{ fontSize: 13, color: "#1e293b", fontWeight: 500, margin: 0 }}>
      {value != null && value !== "" ? String(value) : "—"}
    </p>
  </div>
);

const Tag = ({ children, yellow }) => (
  <span
    style={{
      fontSize: 12,
      padding: "2px 8px",
      background: yellow ? "#fef9c3" : "#f1f5f9",
      borderRadius: 4,
      color: yellow ? "#713f12" : "#374151",
      border: yellow ? "1px solid #fde68a" : "1px solid #e5e7eb",
    }}
  >
    {children}
  </span>
);

// ---- Main Panel ----

const LeadDetailPanel = ({ lead, onClose }) => {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatSessions, setChatSessions] = useState([]);
  const [chatLoading, setChatLoading] = useState(true);
  const [resumeError, setResumeError] = useState("");

  useEffect(() => {
    if (!lead) return;
    setLoading(true);
    setError("");
    setDetail(null);
    setChatSessions([]);
    setChatLoading(true);

    adminGetLeadDetail(lead.user_id)
      .then(setDetail)
      .catch(() => setError("Failed to load lead details."))
      .finally(() => setLoading(false));

    // Chat sessions via window.supabase (may not be available)
    const supa = window?.supabase;
    if (supa?.from) {
      Promise.resolve(
        supa
          .from("chat_sessions")
          .select("*")
          .eq("user_id", lead.user_id)
          .order("created_at", { ascending: false })
      )
        .then(({ data, error: err }) => {
          if (!err && data) setChatSessions(data);
        })
        .finally(() => setChatLoading(false));
    } else {
      setChatLoading(false);
    }
  }, [lead]);

  const handleViewResume = async () => {
    setResumeError("");
    try {
      const { signed_url } = await getResumeUrl(lead.user_id);
      window.open(signed_url, "_blank");
    } catch {
      setResumeError("Failed to get resume URL.");
    }
  };

  if (!lead) return null;

  const profile = detail?.profile ?? {};
  const pre = detail?.pre_analysis;
  const sessions = detail?.sessions ?? [];
  const classification =
    lead.latest_classification ||
    (sessions.length > 0 ? sessions[0].classification : null);

  const edu = profile.current_education ?? {};
  const budget = profile.budget ?? {};
  const timeline = profile.timeline ?? {};
  const scores = profile.test_scores ?? {};
  const completeness = pre?.profile_completeness_score ?? null;

  return (
    <>
      {/* Dim overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.25)",
          zIndex: 100,
        }}
      />

      {/* Slide-in panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: "55%",
          minWidth: 540,
          height: "100vh",
          background: "#fff",
          zIndex: 101,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.09)",
          animation: "panelSlideIn 280ms ease",
        }}
      >
        {/* Fixed header */}
        <div
          style={{
            padding: "14px 22px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
            background: "#fff",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#1e293b",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {lead.full_name || "Unknown"}
              </h2>
              {classification && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 12,
                    flexShrink: 0,
                    ...classBadgeStyle(classification),
                  }}
                >
                  {String(classification).toUpperCase()}
                </span>
              )}
            </div>
            <p style={{ fontSize: 11, color: "#64748b", margin: "2px 0 0" }}>{lead.email}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              fontSize: 22,
              color: "#94a3b8",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 6px",
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px" }}>
          {loading && (
            <p style={{ color: "#64748b", fontSize: 14 }}>Loading…</p>
          )}
          {error && (
            <p style={{ color: "#dc2626", fontSize: 14 }}>{error}</p>
          )}

          {detail && (
            <>
              {/* ── Section A: Contact & Basic Info ── */}
              <SectionTitle>Contact & Basic Info</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Email" value={profile.email} />
                <Field label="Phone" value={profile.phone} />
                <Field label="Age" value={profile.age} />
                <Field label="Preferred Language" value={profile.preferred_language} />
                <Field
                  label="Visa Rejection History"
                  value={
                    profile.previous_visa_rejection === true
                      ? "Yes"
                      : profile.previous_visa_rejection === false
                      ? "No"
                      : "—"
                  }
                />
              </div>

              <Divider />

              {/* ── Section B: Academic Profile ── */}
              <SectionTitle>Academic Profile</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <Field label="Education Level" value={edu.level} />
                <Field label="Field of Study" value={edu.field} />
                <Field label="Institution" value={edu.institution} />
                <Field label="GPA" value={edu.gpa} />
                <Field label="Graduation Year" value={edu.graduation_year} />
                <Field label="Target Course" value={profile.target_course} />
              </div>
              {profile.target_countries?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 10, color: "#94a3b8", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Target Countries
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {profile.target_countries.map((c) => (
                      <Tag key={c}>{c}</Tag>
                    ))}
                  </div>
                </div>
              )}
              {profile.target_universities?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 10, color: "#94a3b8", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    Target Universities
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {profile.target_universities.map((u) => (
                      <Tag key={u}>{u}</Tag>
                    ))}
                  </div>
                </div>
              )}

              <Divider />

              {/* ── Section C: Test Scores ── */}
              <SectionTitle>Test Scores</SectionTitle>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  ["IELTS", scores.ielts],
                  ["TOEFL", scores.toefl],
                  ["GRE", scores.gre],
                  ["GMAT", scores.gmat],
                  ["Duolingo", scores.duolingo],
                ].map(([name, score]) => (
                  <div
                    key={name}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      padding: "8px 14px",
                      textAlign: "center",
                      minWidth: 64,
                    }}
                  >
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>
                      {score ?? "—"}
                    </p>
                    <p style={{ fontSize: 10, color: "#94a3b8", margin: "3px 0 0" }}>{name}</p>
                  </div>
                ))}
              </div>

              <Divider />

              {/* ── Section D: Budget & Timeline ── */}
              <SectionTitle>Budget & Timeline</SectionTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 10 }}>Budget</p>
                  <div style={{ display: "grid", gap: 10 }}>
                    <Field label="Annual Tuition (USD)" value={usd(budget.annual_tuition_usd)} />
                    <Field label="Living Expenses (USD)" value={usd(budget.living_expenses_usd)} />
                    <Field label="Funding Source" value={budget.funding_source} />
                    <Field
                      label="Scholarship Applied"
                      value={
                        budget.scholarship_applied === true
                          ? "Yes"
                          : budget.scholarship_applied === false
                          ? "No"
                          : "Unknown"
                      }
                    />
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 10 }}>Timeline</p>
                  <div style={{ display: "grid", gap: 10 }}>
                    <Field label="Preferred Intake" value={timeline.preferred_intake} />
                    <Field label="Months to Start" value={timeline.months_to_start} />
                    <Field
                      label="Deadline Awareness"
                      value={
                        timeline.application_deadline_awareness === true
                          ? "Yes"
                          : timeline.application_deadline_awareness === false
                          ? "No"
                          : "Unknown"
                      }
                    />
                  </div>
                </div>
              </div>

              <Divider />

              {/* ── Section E: Pre-Analysis ── */}
              <SectionTitle>Pre-Analysis</SectionTitle>
              {pre ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Profile Completeness */}
                  {completeness != null && (
                    <div>
                      <p style={{ fontSize: 10, color: "#94a3b8", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Profile Completeness
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 120,
                            height: 5,
                            background: "#e5e7eb",
                            borderRadius: 3,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${completeness}%`,
                              background:
                                completeness >= 70
                                  ? "#16a34a"
                                  : completeness >= 40
                                  ? "#ea580c"
                                  : "#dc2626",
                              borderRadius: 3,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b" }}>
                          {completeness}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Initial Lead Hint */}
                  {pre.initial_lead_hint && (
                    <div>
                      <p style={{ fontSize: 10, color: "#94a3b8", margin: "0 0 5px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Initial Lead Hint
                      </p>
                      <span
                        style={{
                          fontSize: 12,
                          padding: "3px 10px",
                          borderRadius: 12,
                          ...classBadgeStyle(pre.initial_lead_hint),
                        }}
                      >
                        {pre.initial_lead_hint}
                      </span>
                    </div>
                  )}

                  {/* Suggested Focus Areas */}
                  {pre.suggested_focus_areas?.length > 0 && (
                    <div>
                      <p style={{ fontSize: 10, color: "#94a3b8", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Suggested Focus Areas
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {pre.suggested_focus_areas.map((a, i) => (
                          <Tag key={i}>{a}</Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Initial Observations */}
                  {pre.initial_observations?.length > 0 && (
                    <div>
                      <p style={{ fontSize: 10, color: "#94a3b8", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Initial Observations
                      </p>
                      <ol style={{ margin: 0, paddingLeft: 18 }}>
                        {pre.initial_observations.map((obs, i) => (
                          <li key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>
                            {obs}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Gaps to Probe — highlighted as action items */}
                  {pre.gaps_to_probe?.length > 0 && (
                    <div
                      style={{
                        background: "#fefce8",
                        border: "1px solid #fde68a",
                        borderRadius: 6,
                        padding: "10px 14px",
                      }}
                    >
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#a16207", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Gaps to Probe
                      </p>
                      <ol style={{ margin: 0, paddingLeft: 18 }}>
                        {pre.gaps_to_probe.map((g, i) => (
                          <li key={i} style={{ fontSize: 13, color: "#713f12", marginBottom: 4 }}>
                            {g}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "#94a3b8" }}>No pre-analysis available.</p>
              )}

              <Divider />

              {/* ── Section F: Session Reports ── */}
              <SectionTitle>Session Reports ({sessions.length})</SectionTitle>
              {sessions.length === 0 ? (
                <p style={{ fontSize: 13, color: "#94a3b8" }}>No sessions yet.</p>
              ) : (
                sessions.map((session, i) => (
                  <SessionReportCard
                    key={session.session_id}
                    session={session}
                    index={i}
                  />
                ))
              )}

              <Divider />

              {/* ── Section G: Chat Session Summaries ── */}
              <SectionTitle>Chat Session Summaries</SectionTitle>
              {chatLoading ? (
                <p style={{ fontSize: 13, color: "#64748b" }}>Loading…</p>
              ) : chatSessions.length === 0 ? (
                <p style={{ fontSize: 13, color: "#94a3b8" }}>No chat sessions found.</p>
              ) : (
                chatSessions.map((cs, i) => (
                  <div
                    key={cs.id || i}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      padding: "10px 14px",
                      marginBottom: 10,
                    }}
                  >
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 5px" }}>
                      {formatDate(cs.created_at)}
                    </p>
                    <p style={{ fontSize: 13, color: "#374151", lineHeight: 1.6, margin: 0 }}>
                      {cs.summary || "No summary generated"}
                    </p>
                  </div>
                ))
              )}

              <Divider />

              {/* ── Section H: Resume ── */}
              <SectionTitle>Resume</SectionTitle>
              {profile.resume_url ? (
                <div>
                  <button
                    onClick={handleViewResume}
                    style={{
                      padding: "7px 16px",
                      border: "1px solid #d1d5db",
                      borderRadius: 6,
                      fontSize: 13,
                      cursor: "pointer",
                      background: "#fff",
                      color: "#1e293b",
                      fontWeight: 500,
                    }}
                  >
                    View Resume ↗
                  </button>
                  {resumeError && (
                    <p style={{ color: "#dc2626", fontSize: 12, marginTop: 6 }}>{resumeError}</p>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: 13, color: "#94a3b8" }}>No resume uploaded</p>
              )}

              <Divider />

              {/* ── Section I: Manual Notify ── */}
              <SectionTitle>Notifications</SectionTitle>
              <NotifyForm userId={lead.user_id} />

              {/* Bottom padding */}
              <div style={{ height: 32 }} />
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes panelSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default LeadDetailPanel;
