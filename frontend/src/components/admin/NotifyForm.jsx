import { useState } from "react";
import { adminNotifyUser } from "@/lib/api";

const NotifyForm = ({ userId }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("high");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setError("");
    try {
      await adminNotifyUser(userId, message, priority);
      setSuccess(true);
      setOpen(false);
      setMessage("");
    } catch {
      setError("Failed to send. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {success ? (
        <p style={{ color: "#16a34a", fontSize: 13, fontWeight: 500 }}>Notification sent</p>
      ) : !open ? (
        <button
          onClick={() => setOpen(true)}
          style={{
            padding: "8px 18px",
            background: "#1e293b",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          Send Callback Notification
        </button>
      ) : (
        <div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a note for the counsellor team..."
            rows={3}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 13,
              resize: "vertical",
              boxSizing: "border-box",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{
                padding: "6px 10px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 13,
                color: "#374151",
                background: "#fff",
              }}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button
              onClick={handleSubmit}
              disabled={loading || !message.trim()}
              style={{
                padding: "6px 16px",
                background: "#1e293b",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading || !message.trim() ? 0.5 : 1,
              }}
            >
              {loading ? "Sending…" : "Submit"}
            </button>
            <button
              onClick={() => { setOpen(false); setError(""); }}
              style={{
                padding: "6px 14px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 13,
                cursor: "pointer",
                background: "#fff",
                color: "#374151",
              }}
            >
              Cancel
            </button>
          </div>
          {error && <p style={{ color: "#dc2626", fontSize: 13, marginTop: 8 }}>{error}</p>}
        </div>
      )}
    </div>
  );
};

export default NotifyForm;
