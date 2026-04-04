import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function getSupabaseBearerToken() {
  try {
    const supabase = window?.supabase;
    if (supabase?.auth?.getSession) {
      const sessionResp = await supabase.auth.getSession();
      const token = sessionResp?.data?.session?.access_token;
      if (token) return token;
    }
  } catch {
    // no-op fallback
  }
  return localStorage.getItem("access_token");
}

async function callChatApi(path, options = {}) {
  const token = await getSupabaseBearerToken();
  if (!token) throw new Error("Missing auth token");
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    throw new Error("Chat API request failed");
  }
  return res.json();
}

const baseStyles = {
  toggle: {
    position: "fixed",
    bottom: 24,
    left: 24,
    zIndex: 1000,
    width: 56,
    height: 56,
    borderRadius: "50%",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    cursor: "pointer",
    fontSize: 22,
    boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
  },
  panel: (open) => ({
    position: "fixed",
    bottom: 24,
    left: 24,
    zIndex: 1000,
    width: 360,
    height: 500,
    background: "#ffffff",
    border: "1px solid #d1d5db",
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    opacity: open ? 1 : 0,
    transform: open ? "translateY(0px)" : "translateY(10px)",
    pointerEvents: open ? "auto" : "none",
    transition: "opacity 0.2s ease, transform 0.2s ease",
  }),
  header: {
    height: 52,
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 10px 0 12px",
    fontSize: 14,
    fontWeight: 600,
  },
  msgArea: {
    flex: 1,
    overflowY: "auto",
    padding: 12,
    background: "#f8fafc",
  },
  inputWrap: {
    borderTop: "1px solid #e5e7eb",
    padding: 10,
    display: "flex",
    gap: 8,
  },
};

export default function ChatBot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [chatSessionId, setChatSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [ended, setEnded] = useState(false);
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  const shouldRender = useMemo(() => {
    if (!user) return false;
    const role = (user.role || "").toLowerCase();
    return role !== "admin" && role !== "counsellor" && role !== "counselor";
  }, [user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!open || chatSessionId || ended || !shouldRender) return;
    const run = async () => {
      try {
        const data = await callChatApi("/chat/start", { method: "POST" });
        setChatSessionId(data.chat_session_id);
      } catch {
        setMessages((prev) => [...prev, { role: "ai", text: "Something went wrong. Please try again." }]);
      }
    };
    run();
  }, [open, chatSessionId, ended, shouldRender]);

  if (!shouldRender) return null;

  const onSend = async () => {
    const text = input.trim();
    if (!text || !chatSessionId || ended || busy) return;
    setBusy(true);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setIsTyping(true);
    try {
      const data = await callChatApi(`/chat/${chatSessionId}/message`, {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });
      setMessages((prev) => [...prev, { role: "ai", text: data.reply || "" }]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "Something went wrong. Please try again." }]);
    } finally {
      setIsTyping(false);
      setBusy(false);
    }
  };

  const onEndChat = async () => {
    if (!chatSessionId || ended || busy) return;
    setBusy(true);
    try {
      const data = await callChatApi(`/chat/${chatSessionId}/end`, { method: "POST" });
      const summaryText = data.summary || "";
      setSummary(summaryText);
      setEnded(true);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: `Chat Summary: ${summaryText || "No summary available."}` },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "Something went wrong. Please try again." }]);
    } finally {
      setBusy(false);
    }
  };

  const onStartNewChat = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const data = await callChatApi("/chat/start", { method: "POST" });
      setChatSessionId(data.chat_session_id);
      setEnded(false);
      setSummary("");
      setMessages([]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", text: "Something went wrong. Please try again." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button style={baseStyles.toggle} onClick={() => setOpen(true)} aria-label="Open chat assistant">
          💬
        </button>
      )}

      <div style={baseStyles.panel(open)}>
        <div style={baseStyles.header}>
          <span>Aria — Study Abroad Assistant</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={onEndChat}
              disabled={!chatSessionId || ended || busy}
              style={{ fontSize: 12, padding: "4px 8px", cursor: "pointer" }}
            >
              End Chat
            </button>
            <button type="button" onClick={() => setOpen(false)} style={{ fontSize: 14, padding: "4px 8px", cursor: "pointer" }}>
              X
            </button>
          </div>
        </div>

        <div style={baseStyles.msgArea}>
          {messages.map((m, idx) => (
            <div key={`${m.role}-${idx}`} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}>
              <div
                style={{
                  maxWidth: "80%",
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: m.role === "ai" ? "1px solid #d1d5db" : "1px solid #bfdbfe",
                  background: m.role === "user" ? "#dbeafe" : "#ffffff",
                  color: "#0f172a",
                  fontSize: 13,
                  whiteSpace: "pre-wrap",
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
          {isTyping && <div style={{ fontSize: 12, color: "#475569" }}>Aria is typing...</div>}
          <div ref={endRef} />
        </div>

        <div style={baseStyles.inputWrap}>
          {ended ? (
            <button type="button" onClick={onStartNewChat} disabled={busy} style={{ width: "100%", padding: "10px", cursor: "pointer" }}>
              Start New Chat
            </button>
          ) : (
            <>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onSend();
                }}
                disabled={busy}
                placeholder="Ask about countries, visas, tests..."
                style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 8, padding: "10px 12px", fontSize: 13 }}
              />
              <button type="button" onClick={onSend} disabled={busy || !input.trim()} style={{ padding: "10px 14px", cursor: "pointer" }}>
                Send
              </button>
            </>
          )}
        </div>
        {ended && summary && <div style={{ fontSize: 0, height: 0, overflow: "hidden" }}>{summary}</div>}
      </div>
    </>
  );
}
