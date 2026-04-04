import { useState } from "react";
import LeadRow from "./LeadRow";

const COLS = [
  "NAME",
  "CONTACT",
  "COURSE & COUNTRIES",
  "LEAD SCORE",
  "PROFILE COMPLETE",
  "BUDGET READINESS",
  "SESSIONS",
  "LAST ACTIVE",
  "RESUME",
];

const LeadsTable = ({
  leads,
  loading,
  page,
  totalPages,
  total,
  onPageChange,
  onFilterChange,
  onSortChange,
  onRowClick,
}) => {
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("urgency");

  const handleFilter = (val) => {
    setFilter(val);
    onFilterChange(val);
  };

  const handleSort = (val) => {
    setSort(val);
    onSortChange(val);
  };

  const btnStyle = (disabled) => ({
    padding: "6px 14px",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.35 : 1,
    background: "#fff",
    color: "#374151",
  });

  const selectStyle = {
    padding: "6px 10px",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    fontSize: 13,
    color: "#374151",
    background: "#fff",
    outline: "none",
  };

  return (
    <div>
      {/* Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>All Leads</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <select value={filter} onChange={(e) => handleFilter(e.target.value)} style={selectStyle}>
            <option value="">All</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </select>
          <select value={sort} onChange={(e) => handleSort(e.target.value)} style={selectStyle}>
            <option value="urgency">Default (Urgency)</option>
            <option value="newest">Newest</option>
            <option value="score">Highest Score</option>
          </select>
        </div>
      </div>

      {/* Table container */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        {loading ? (
          <div style={{ padding: 20 }}>
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 38,
                    background: "#f1f5f9",
                    borderRadius: 4,
                    marginBottom: 8,
                    opacity: 1 - i * 0.12,
                  }}
                />
              ))}
          </div>
        ) : leads.length === 0 ? (
          <p
            style={{
              padding: 40,
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 14,
              margin: 0,
            }}
          >
            No leads found.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e5e7eb", background: "#fafafa" }}>
                  {COLS.map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: "9px 14px",
                        textAlign: "left",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#94a3b8",
                        letterSpacing: "0.06em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <LeadRow key={lead.user_id} lead={lead} onClick={() => onRowClick(lead)} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 12,
          fontSize: 13,
        }}
      >
        <span style={{ color: "#64748b" }}>
          Page {page} of {totalPages} · {total} total
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            style={btnStyle(page === 1)}
          >
            Prev
          </button>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            style={btnStyle(page >= totalPages)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadsTable;
