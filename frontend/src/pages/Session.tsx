/**
 * Session.tsx — Live AI counseling session page.
 *
 * Flow:
 *  1. Mount: fetch session data (or use router state passed from Dashboard).
 *  2. Request microphone permission.
 *  3. WebRTC signaling over /session/{id}/signal WS:
 *     - Create RTCPeerConnection, create SDP offer, send to backend.
 *     - Receive SDP answer + ICE candidates, exchange ours.
 *     - On "ready" — session is live.
 *  4. Open stream WS /session/{id}/stream:
 *     - Capture PCM audio via AudioContext → base64 → send as audio_chunk.
 *     - Receive transcript_chunk → display live transcript.
 *     - Receive audio_response → play through speaker.
 *     - Receive language_detected → show in UI.
 *  5. End call:
 *     - Send session_end_signal over stream WS.
 *     - POST /session/{id}/end.
 *     - Poll /session/{id}/status until "ended".
 *     - Navigate back to /dashboard.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import {
  openSignalingWS,
  openStreamWS,
  endSession,
  getSessionStatus,
  getSession,
  type WebRTCConfig,
  type SessionData,
} from "@/lib/api";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface TranscriptLine {
  id: number;
  speaker: "ai" | "user";
  text: string;
  language?: string;
}

type SessionPhase =
  | "loading"
  | "requesting-mic"
  | "signaling"
  | "live"
  | "ending"
  | "ended"
  | "error";

// Convert Float32 samples (-1..1) → Int16Array → base64
function float32ToBase64PCM(samples: Float32Array): string {
  const int16 = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i++) {
    int16[i] = Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32768)));
  }
  const bytes = new Uint8Array(int16.buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// Decode base64 PCM → AudioBuffer and play it
function playPCMAudio(base64Data: string, audioCtx: AudioContext): void {
  try {
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768;
    const buffer = audioCtx.createBuffer(1, float32.length, 16000);
    buffer.copyToChannel(float32, 0);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start();
  } catch {
    // Non-fatal — skip malformed audio frames
  }
}

const Session = () => {
  useDocumentTitle("AI Session");
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<SessionPhase>("loading");
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const sigWsRef = useRef<WebSocket | null>(null);
  const streamWsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptIdRef = useRef(0);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Elapsed timer while live
  useEffect(() => {
    if (phase === "live") {
      timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  const addTranscript = useCallback((speaker: "ai" | "user", text: string, language?: string) => {
    setTranscript((prev) => [
      ...prev,
      { id: ++transcriptIdRef.current, speaker, text, language },
    ]);
  }, []);

  // ---- Clean up all media / connections ----
  const cleanup = useCallback(() => {
    processorRef.current?.disconnect();
    audioCtxRef.current?.close().catch(() => {});
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    sigWsRef.current?.close();
    streamWsRef.current?.close();
    pcRef.current?.close();
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  // ---- Start stream WebSocket after signaling completes ----
  const startStream = useCallback(() => {
    if (!sessionId) return;
    setPhase("live");
    const ws = openStreamWS(sessionId);
    streamWsRef.current = ws;

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data as string) as {
          type: string;
          speaker?: "ai" | "user";
          text?: string;
          language?: string;
          data?: string;
          timestamp_ms?: number;
          status?: string;
          code?: string;
          message?: string;
        };

        if (msg.type === "transcript_chunk" && msg.speaker && msg.text) {
          addTranscript(msg.speaker, msg.text, msg.language);
        } else if (msg.type === "audio_response" && msg.data && audioCtxRef.current) {
          playPCMAudio(msg.data, audioCtxRef.current);
        } else if (msg.type === "language_detected" && msg.language) {
          setDetectedLanguage(msg.language);
        } else if (msg.type === "session_status" && msg.status === "ended") {
          endCallFlow();
        } else if (msg.type === "error") {
          setErrorMsg(msg.message ?? "Stream error");
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => setErrorMsg("Stream connection error.");
    ws.onclose = () => {
      if (phase === "live") setPhase("ending");
    };

    // ---- Start sending audio ----
    const AudioContextClass =
      window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioCtx = new AudioContextClass({ sampleRate: 16000 });
    audioCtxRef.current = audioCtx;

    if (micStreamRef.current) {
      const source = audioCtx.createMediaStreamSource(micStreamRef.current);
      // ScriptProcessorNode is deprecated but universally supported; AudioWorklet needs a worker file.
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      source.connect(processor);
      processor.connect(audioCtx.destination);

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const samples = e.inputBuffer.getChannelData(0);
        ws.send(
          JSON.stringify({
            type: "audio_chunk",
            data: float32ToBase64PCM(samples),
            timestamp_ms: Date.now(),
          })
        );
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, addTranscript]);

  // ---- Run WebRTC signaling ----
  const startSignaling = useCallback(
    (webrtcConfig: WebRTCConfig, stream: MediaStream) => {
      if (!sessionId) return;
      setPhase("signaling");

      const pc = new RTCPeerConnection({ iceServers: webrtcConfig.ice_servers });
      pcRef.current = pc;

      // Add mic track so the backend can receive audio via WebRTC as well
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      const ws = openSignalingWS(sessionId);
      sigWsRef.current = ws;

      // When we gather ICE candidates, send them to the backend
      pc.onicecandidate = (evt) => {
        if (evt.candidate && ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "ice_candidate",
              candidate: evt.candidate.candidate,
              sdpMid: evt.candidate.sdpMid,
              sdpMLineIndex: evt.candidate.sdpMLineIndex,
            })
          );
        }
      };

      ws.onopen = async () => {
        // Create and send SDP offer
        const offer = await pc.createOffer({ offerToReceiveAudio: true });
        await pc.setLocalDescription(offer);
        ws.send(JSON.stringify({ type: "offer", sdp: offer.sdp }));
      };

      ws.onmessage = async (evt) => {
        const msg = JSON.parse(evt.data as string) as {
          type: string;
          sdp?: string;
          candidate?: string;
          sdpMid?: string;
          sdpMLineIndex?: number;
          message?: string;
        };

        if (msg.type === "answer" && msg.sdp) {
          await pc.setRemoteDescription({ type: "answer", sdp: msg.sdp });
        } else if (msg.type === "ice_candidate" && msg.candidate) {
          await pc.addIceCandidate({
            candidate: msg.candidate,
            sdpMid: msg.sdpMid,
            sdpMLineIndex: msg.sdpMLineIndex ?? 0,
          });
        } else if (msg.type === "ready") {
          ws.close();
          startStream();
        } else if (msg.type === "error") {
          setPhase("error");
          setErrorMsg(msg.message ?? "Signaling failed");
        }
      };

      ws.onerror = () => {
        setPhase("error");
        setErrorMsg("Signaling WebSocket error. Check your connection.");
      };
    },
    [sessionId, startStream]
  );

  // ---- End call logic ----
  const endCallFlow = useCallback(async () => {
    setPhase("ending");

    // Gracefully notify the backend over the stream WS before closing
    if (streamWsRef.current?.readyState === WebSocket.OPEN) {
      streamWsRef.current.send(JSON.stringify({ type: "session_end_signal" }));
    }

    cleanup();

    if (sessionId) {
      try {
        await endSession(sessionId);
      } catch {
        // Backend may have already closed it
      }

      // Poll until the backend confirms "ended" (report generation may take a moment)
      let attempts = 0;
      while (attempts < 20) {
        await new Promise((r) => setTimeout(r, 1500));
        try {
          const { status } = await getSessionStatus(sessionId);
          if (status === "ended" || status === "failed") break;
        } catch {
          break;
        }
        attempts++;
      }
    }

    setPhase("ended");
  }, [sessionId, cleanup]);

  // ---- Mount: fetch session + get mic + start WebRTC ----
  useEffect(() => {
    if (!sessionId) return;

    const routerState = location.state as { webrtc_config?: WebRTCConfig } | null;

    const init = async () => {
      setPhase("loading");

      // 1. Fetch session data
      let webrtcConfig: WebRTCConfig | null = routerState?.webrtc_config ?? null;
      try {
        const s = await getSession(sessionId);
        setSessionData(s);
        if (!webrtcConfig) {
          // webrtc_config is only in the create response; if we navigated directly we won't have it.
          // Provide a default STUN config so the connection can still be attempted.
          webrtcConfig = {
            ice_servers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
            ],
          };
        }
      } catch {
        setPhase("error");
        setErrorMsg("Session not found.");
        return;
      }

      // 2. Request microphone
      setPhase("requesting-mic");
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        micStreamRef.current = stream;
      } catch {
        setPhase("error");
        setErrorMsg(
          "Microphone access denied. Please allow microphone access and try again."
        );
        return;
      }

      // 3. Start WebRTC signaling
      startSignaling(webrtcConfig, stream);
    };

    init();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // ---- Render ----

  if (phase === "ended") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f7fbff] px-4 text-center">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">
            ✓
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Session complete</h1>
          <p className="mt-2 text-slate-600">
            Your AI counseling session has ended. Our team will follow up with you.
          </p>
          <Link
            to="/dashboard"
            className="mt-6 inline-block rounded-xl bg-sky-600 px-8 py-3 text-sm font-semibold text-white hover:bg-sky-700"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
        <div className="flex items-center gap-3">
          <img src="/landing/fateh_logo.png" alt="Fateh" className="h-7 w-auto brightness-200" />
          <span className="text-sm font-semibold text-slate-300">AI Counseling Session</span>
          {detectedLanguage && (
            <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
              {detectedLanguage.toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {phase === "live" && (
            <>
              <span className="flex items-center gap-1.5 text-sm text-green-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
                Live · {formatTime(elapsedSeconds)}
              </span>
            </>
          )}
          {phase === "signaling" && (
            <span className="text-sm text-amber-400">Connecting…</span>
          )}
          {phase === "requesting-mic" && (
            <span className="text-sm text-sky-400">Requesting microphone…</span>
          )}
          {phase === "loading" && (
            <span className="text-sm text-slate-400">Loading session…</span>
          )}
          {phase === "ending" && (
            <span className="text-sm text-slate-400">Ending session…</span>
          )}
        </div>
      </header>

      {/* Error banner */}
      {(phase === "error" || errorMsg) && (
        <div className="border-b border-red-900 bg-red-950 px-6 py-3 text-sm text-red-300">
          {errorMsg || "An error occurred."}
          {phase === "error" && (
            <Link to="/dashboard" className="ml-4 underline">
              Return to dashboard
            </Link>
          )}
        </div>
      )}

      {/* Session info bar */}
      {sessionData && (
        <div className="border-b border-slate-800 bg-slate-900 px-6 py-2 text-xs text-slate-400">
          Session ID: {sessionData.session_id}
        </div>
      )}

      {/* Transcript area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
        {transcript.length === 0 && phase !== "error" && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
            {phase === "loading" && <p>Loading session…</p>}
            {phase === "requesting-mic" && <p>Requesting microphone access…</p>}
            {phase === "signaling" && (
              <>
                <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
                <p>Establishing secure connection…</p>
              </>
            )}
            {phase === "live" && (
              <p>
                Your session is live. Start speaking — our AI counselor is listening.
              </p>
            )}
          </div>
        )}
        <div className="mx-auto max-w-3xl space-y-4">
          {transcript.map((line) => (
            <div
              key={line.id}
              className={`flex ${line.speaker === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  line.speaker === "user"
                    ? "bg-sky-600 text-white"
                    : "bg-slate-800 text-slate-100"
                }`}
              >
                <span className="mb-1 block text-xs font-semibold opacity-60">
                  {line.speaker === "ai" ? "AI Counselor" : "You"}
                  {line.language ? ` · ${line.language}` : ""}
                </span>
                {line.text}
              </div>
            </div>
          ))}
          <div ref={transcriptEndRef} />
        </div>
      </div>

      {/* End call button */}
      <footer className="border-t border-slate-800 bg-slate-900 px-6 py-4">
        <div className="mx-auto flex max-w-3xl justify-center">
          <button
            onClick={endCallFlow}
            disabled={phase === "ending" || phase === "ended" || phase === "loading"}
            className="rounded-full bg-red-600 px-8 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-red-700 disabled:opacity-50"
          >
            {phase === "ending" ? "Ending…" : "End Session"}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default Session;
