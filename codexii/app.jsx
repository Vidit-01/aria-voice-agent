import { useState, useEffect, useRef, useCallback } from "react";

// ── CONFIG ────────────────────────────────────────────────────────────────
const GOOGLE_API_KEY = "AIzaSyDfopbleVpg9cOCyHD4ySxOjHfpadfpeO4";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`;
const SYSTEM_PROMPT = `You are a fast, helpful voice assistant. Keep every reply to 1–3 sentences unless the user explicitly asks for more. Be direct and conversational.`;

// ── GEMINI ────────────────────────────────────────────────────────────────
async function askGemini(history) {
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: history,
      generationConfig: { maxOutputTokens: 300, temperature: 0.85 },
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates[0].content.parts[0].text.trim();
}

// ── KEYFRAMES (injected once) ─────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body, #root {
    font-family: 'Outfit', sans-serif;
    background: #07080f;
    min-height: 100vh;
  }

  @keyframes breathe {
    0%,100% { transform: scale(1);   opacity:.9; }
    50%      { transform: scale(1.07); opacity:1; }
  }
  @keyframes pulse-fast {
    0%,100% { transform: scale(1);   }
    50%      { transform: scale(1.12); }
  }
  @keyframes spin-glow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes wave {
    0%,100% { transform: scaleY(1);   }
    50%      { transform: scaleY(1.6); }
  }
  @keyframes ring-out {
    0%   { transform: scale(1);   opacity: .55; }
    100% { transform: scale(2.5); opacity: 0;   }
  }
  @keyframes slide-up {
    from { opacity:0; transform: translateY(8px); }
    to   { opacity:1; transform: translateY(0);   }
  }
  @keyframes dot-bounce {
    0%,80%,100% { transform: translateY(0); }
    40%          { transform: translateY(-6px); }
  }

  .msg-enter { animation: slide-up .28s ease both; }

  .orb-idle     { animation: breathe    3s ease-in-out infinite; }
  .orb-listen   { animation: pulse-fast .75s ease-in-out infinite; }
  .orb-think    { animation: spin-glow  1.4s linear infinite; }
  .orb-speak    { animation: wave       .55s ease-in-out infinite; }

  .ring-1 { animation: ring-out 1.6s ease-out infinite; }
  .ring-2 { animation: ring-out 1.6s ease-out .45s infinite; }

  .dot { animation: dot-bounce 1.2s ease-in-out infinite; }
  .dot:nth-child(2) { animation-delay:.18s; }
  .dot:nth-child(3) { animation-delay:.36s; }

  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,.08); border-radius: 2px; }
`;

// ── PHASE CONFIG ──────────────────────────────────────────────────────────
const PHASES = {
  idle:      { color: "#6366f1", glow: "rgba(99,102,241,.45)",  label: "Tap to speak",      hint: "Voice Assistant Ready" },
  listening: { color: "#06b6d4", glow: "rgba(6,182,212,.50)",   label: "Listening…",         hint: "Say something" },
  thinking:  { color: "#a855f7", glow: "rgba(168,85,247,.50)",  label: "Thinking…",          hint: "Gemini is processing" },
  speaking:  { color: "#10b981", glow: "rgba(16,185,129,.45)",  label: "Speaking",           hint: "Tap to interrupt" },
  error:     { color: "#ef4444", glow: "rgba(239,68,68,.45)",   label: "Error",              hint: "" },
};

// ── ORB ICON ──────────────────────────────────────────────────────────────
function OrbIcon({ phase }) {
  if (phase === "listening")
    return (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8"  y1="23" x2="16" y2="23" />
      </svg>
    );
  if (phase === "thinking")
    return (
      <div style={{ display: "flex", gap: 5 }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="dot" style={{ width: 9, height: 9, borderRadius: "50%", background: "white", opacity: .9, animationDelay: `${i * .18}s` }} />
        ))}
      </div>
    );
  if (phase === "speaking")
    return (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    );
  if (phase === "error")
    return (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  return (
    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8"  y1="23" x2="16" y2="23" />
    </svg>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function VoiceAssistant() {
  const [phase, setPhase]     = useState("idle");
  const [messages, setMessages] = useState([]);
  const [interim, setInterim]  = useState("");
  const [errMsg, setErrMsg]   = useState("");

  const recognitionRef = useRef(null);
  const historyRef     = useRef([]);
  const msgsEndRef     = useRef(null);
  const phaseRef       = useRef("idle");

  // Keep phaseRef in sync
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Auto-scroll
  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Inject CSS once
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  // ── SPEAK ────────────────────────────────────────────────────────────────
  const speak = useCallback((text, onDone) => {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate  = 1.05;
    utt.pitch = 1.0;
    // Prefer Google en voice if available
    const voices  = synth.getVoices();
    const voice   = voices.find((v) => /Google.*en/i.test(v.name))
                 || voices.find((v) => v.lang.startsWith("en") && v.localService)
                 || voices.find((v) => v.lang.startsWith("en"));
    if (voice) utt.voice = voice;
    utt.onend  = onDone;
    utt.onerror = onDone;
    synth.speak(utt);
    setPhase("speaking");
  }, []);

  // ── SEND TO GEMINI ────────────────────────────────────────────────────────
  const sendToGemini = useCallback(async (text) => {
    setPhase("thinking");
    setInterim("");

    const userEntry = { role: "user", parts: [{ text }] };
    historyRef.current = [...historyRef.current, userEntry];
    setMessages((m) => [...m, { role: "user", text }]);

    try {
      const reply = await askGemini(historyRef.current);
      const modelEntry = { role: "model", parts: [{ text: reply }] };
      historyRef.current = [...historyRef.current, modelEntry];
      setMessages((m) => [...m, { role: "model", text: reply }]);
      speak(reply, () => setPhase("idle"));
    } catch (e) {
      setErrMsg(e.message);
      setPhase("error");
      setTimeout(() => setPhase("idle"), 3000);
    }
  }, [speak]);

  // ── START LISTENING ───────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setErrMsg("SpeechRecognition not supported. Use Chrome or Edge.");
      setPhase("error");
      setTimeout(() => setPhase("idle"), 3500);
      return;
    }

    window.speechSynthesis.cancel();

    const rec = new SR();
    recognitionRef.current = rec;
    rec.continuous     = false;
    rec.interimResults = true;
    rec.lang           = "en-US";

    rec.onstart = () => setPhase("listening");

    rec.onresult = (e) => {
      let finalText = "", interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText   += e.results[i][0].transcript;
        else                       interimText += e.results[i][0].transcript;
      }
      setInterim(finalText || interimText);
      if (finalText) { rec.stop(); sendToGemini(finalText.trim()); }
    };

    rec.onerror = (e) => {
      if (e.error === "aborted") return;
      setErrMsg(`Mic: ${e.error}`);
      setPhase("error");
      setTimeout(() => setPhase("idle"), 2500);
    };

    rec.onend = () => {
      setPhase((p) => (p === "listening" ? "idle" : p));
    };

    rec.start();
  }, [sendToGemini]);

  // ── STOP LISTENING ────────────────────────────────────────────────────────
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setPhase("idle");
    setInterim("");
  }, []);

  // ── ORB CLICK ─────────────────────────────────────────────────────────────
  const handleOrb = () => {
    if (phase === "idle"  || phase === "error")   return startListening();
    if (phase === "listening")                      return stopListening();
    if (phase === "speaking") { window.speechSynthesis.cancel(); setPhase("idle"); }
  };

  const cfg    = PHASES[phase] || PHASES.idle;
  const orbCls = `orb-${phase === "error" ? "idle" : phase}`;

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: "#07080f",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "28px 16px 40px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient blobs */}
      <div style={{ position:"fixed", top:"8%",  left:"3%",  width:320, height:320, borderRadius:"50%", background:`radial-gradient(circle, ${cfg.color}09 0%, transparent 70%)`, pointerEvents:"none", transition:"background 0.7s" }} />
      <div style={{ position:"fixed", bottom:"10%", right:"4%", width:260, height:260, borderRadius:"50%", background:"radial-gradient(circle, rgba(168,85,247,.07) 0%, transparent 70%)", pointerEvents:"none" }} />

      <div style={{ width:"100%", maxWidth:580, display:"flex", flexDirection:"column", gap:20, zIndex:1 }}>

        {/* ── Header ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 2px" }}>
          <div>
            <div style={{ fontFamily:"'Outfit', sans-serif", fontSize:22, fontWeight:700, color:"#fff", letterSpacing:"-0.5px" }}>
              voice<span style={{ color:cfg.color, transition:"color .5s" }}>AI</span>
            </div>
            <div style={{ fontFamily:"'JetBrains Mono', monospace", fontSize:10, color:"rgba(255,255,255,.28)", letterSpacing:".14em", marginTop:2 }}>
              POWERED BY GEMINI 2.0 FLASH
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:8, padding:"6px 12px", fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:"rgba(255,255,255,.4)", display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:cfg.color, boxShadow:`0 0 6px ${cfg.color}`, transition:"all .5s" }} />
              {phase.toUpperCase()}
            </div>
          </div>
        </div>

        {/* ── Orb ── */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 0 32px", position:"relative" }}>
          <div style={{ position:"relative", cursor:"pointer" }} onClick={handleOrb}>
            {/* Listener rings */}
            {phase === "listening" && <>
              <div className="ring-1" style={{ position:"absolute", inset:-4, borderRadius:"50%", border:`1px solid ${cfg.color}`, pointerEvents:"none" }} />
              <div className="ring-2" style={{ position:"absolute", inset:-4, borderRadius:"50%", border:`1px solid ${cfg.color}`, pointerEvents:"none" }} />
            </>}

            {/* Orb */}
            <div
              className={orbCls}
              style={{
                width:148, height:148, borderRadius:"50%",
                background: phase === "think"
                  ? `conic-gradient(from 0deg, ${cfg.color}cc, ${cfg.color}22, ${cfg.color}cc)`
                  : `radial-gradient(circle at 36% 34%, ${cfg.color}cc, ${cfg.color}44 55%, transparent 80%)`,
                border:`1.5px solid ${cfg.color}55`,
                boxShadow:`0 0 48px ${cfg.glow}, inset 0 0 30px ${cfg.color}18`,
                transition:"background .6s, border-color .6s, box-shadow .6s",
                display:"flex", alignItems:"center", justifyContent:"center",
                userSelect:"none",
              }}
            >
              <OrbIcon phase={phase} />
            </div>
          </div>

          {/* Label */}
          <div style={{ marginTop:22, textAlign:"center" }}>
            <div style={{ fontSize:13, fontWeight:500, letterSpacing:".1em", textTransform:"uppercase", color:cfg.color, transition:"color .5s" }}>
              {cfg.label}
            </div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.3)", marginTop:5, fontFamily:"'JetBrains Mono',monospace", maxWidth:280, textAlign:"center" }}>
              {phase === "listening" && interim
                ? `"${interim}"`
                : phase === "error"
                ? errMsg
                : cfg.hint}
            </div>
          </div>
        </div>

        {/* ── Conversation ── */}
        {messages.length > 0 && (
          <div style={{ background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.06)", borderRadius:16, overflow:"hidden" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 16px", borderBottom:"1px solid rgba(255,255,255,.05)" }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:".16em", color:"rgba(255,255,255,.22)", textTransform:"uppercase" }}>
                Conversation · {messages.length} messages
              </span>
              <button
                onClick={() => { historyRef.current = []; setMessages([]); }}
                style={{ background:"none", border:"none", cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:".1em", color:"rgba(255,255,255,.22)", textTransform:"uppercase", padding:"2px 6px" }}
              >
                Clear
              </button>
            </div>
            <div style={{ maxHeight:340, overflowY:"auto", padding:"14px 14px 10px", display:"flex", flexDirection:"column", gap:10 }}>
              {messages.map((m, i) => (
                <div key={i} className="msg-enter" style={{ display:"flex", justifyContent:m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth:"84%",
                    padding:"10px 14px",
                    borderRadius: m.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
                    background: m.role === "user"
                      ? `linear-gradient(135deg, ${cfg.color}28, ${cfg.color}18)`
                      : "rgba(255,255,255,.04)",
                    border: m.role === "user"
                      ? `1px solid ${cfg.color}38`
                      : "1px solid rgba(255,255,255,.07)",
                    fontSize:13,
                    lineHeight:1.65,
                    color: m.role === "user" ? "rgba(255,255,255,.9)" : "rgba(255,255,255,.72)",
                    fontFamily:"'Outfit', sans-serif",
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={msgsEndRef} />
            </div>
          </div>
        )}

        {/* ── Empty hint ── */}
        {messages.length === 0 && (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.14)", fontFamily:"'JetBrains Mono',monospace", letterSpacing:".08em" }}>
              Tap the orb → speak → get a response
            </div>
          </div>
        )}

        {/* ── Pills ── */}
        <div style={{ display:"flex", justifyContent:"center", gap:8, flexWrap:"wrap" }}>
          {[
            { icon:"🧠", label:"Gemini 2.0 Flash" },
            { icon:"🎙️", label:"Web Speech API" },
            { icon:"🔊", label:"Speech Synthesis" },
            { icon:"💬", label:"Multi-turn" },
          ].map(({ icon, label }) => (
            <div key={label} style={{ padding:"5px 12px", borderRadius:100, background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)", fontSize:11, color:"rgba(255,255,255,.3)", display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ fontSize:13 }}>{icon}</span>{label}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}