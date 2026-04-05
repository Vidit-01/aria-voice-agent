import {
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import { Link } from 'react-router-dom';
import {
  RoomAudioRenderer,
  useSession,
  SessionProvider,
  useAgent,
  useChat,
  useLocalParticipant,
  useTranscriptions,
  useTrackToggle,
} from '@livekit/components-react';
import { TokenSource, Track } from 'livekit-client';
import '@livekit/components-styles';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import VoiceBlob from '@/components/VoiceBlob';
import './VoiceAgent.css';

const tokenSource = TokenSource.sandboxTokenServer('codeshashtra-tg6qxa');

function isBenignDisconnectError(err: unknown) {
  const message =
    typeof err === 'object' && err && 'message' in err
      ? String((err as { message: unknown }).message)
      : '';
  return (
    message.includes('Client initiated disconnect') ||
    message.includes('Abort connection attempt due to user initiated disconnect')
  );
}

type SummaryItem = {
  id: string;
  kind: 'chat' | 'transcript';
  timestamp: number;
  isMine: boolean;
  fromLabel: string;
  text: string;
};

export default function VoiceAgent() {
  useDocumentTitle('Voice Session');
  const [isMinimized, setIsMinimized] = useState(false);

  const sessionOptions = useMemo(() => ({ agentName: 'my-agent' }), []);
  const session = useSession(tokenSource, sessionOptions);
  const startSession = session.start;
  const endSession = session.end;

  useEffect(() => {
    let cancelled = false;

    void startSession().catch((err) => {
      if (cancelled && isBenignDisconnectError(err)) return;
      console.error('LiveKit session.start() failed', err);
    });

    return () => {
      cancelled = true;
      void endSession().catch((err) => {
        if (isBenignDisconnectError(err)) return;
        console.warn('LiveKit session.end() failed', err);
      });
    };
  }, [startSession, endSession]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMinimized(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <SessionProvider session={session}>
      <div
        data-lk-theme="default"
        className={`appShell ${isMinimized ? 'isMinimizedLayout' : ''}`}
      >
        <div className="appBg" aria-hidden="true" />
        <video
          ref={(el) => {
            if (el) {
              el.playbackRate = 0.7;
            }
          }}
          className="cloudVideoBg"
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        >
          <source src="/landing/sky.mp4" type="video/mp4" />
        </video>
        <div className="cloudBgShade" aria-hidden="true" />

        {!isMinimized ? (
          <header className="vaTopBar">
            <Link to="/dashboard" className="vaBackButton">
              ← Dashboard
            </Link>
          </header>
        ) : null}

        <main className={`mainGrid ${isMinimized ? 'isMinimizedGrid' : ''}`}>
          <section
            className={`card leftCard ${isMinimized ? 'isBarePanel' : ''}`}
            aria-label="Voice assistant"
          >
            <AgentPanel
              isMinimized={isMinimized}
              onExpand={() => setIsMinimized(false)}
              onMinimize={() => setIsMinimized(true)}
            />
          </section>

          {!isMinimized ? (
            <aside className="rightColumn" aria-label="Side panels">
              <section className="card chatCard" aria-label="Chat">
                <ChatPanel onMinimize={() => setIsMinimized(true)} />
              </section>
            </aside>
          ) : null}
        </main>

        <RoomAudioRenderer />
      </div>
    </SessionProvider>
  );
}

type AgentPanelProps = {
  isMinimized: boolean;
  onExpand: () => void;
  onMinimize: () => void;
};

function AgentPanel({ isMinimized, onExpand, onMinimize }: AgentPanelProps) {
  const agent = useAgent();
  const isAgentSpeaking = agent.state === 'speaking';
  const micButtonRef = useRef<HTMLButtonElement | null>(null);

  const statusText = useMemo(() => {
    const state = agent.state ?? 'unknown';
    if (state === 'speaking') return 'Speaking...';
    if (state === 'thinking') return 'Thinking...';
    if (state === 'listening' || agent.canListen) return 'Listening...';
    if (state === 'connecting') return 'Connecting...';
    return String(state).replaceAll('-', ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  }, [agent.canListen, agent.state]);

  const { enabled: micEnabled, pending: micPending, buttonProps } = useTrackToggle({
    source: Track.Source.Microphone,
    initialState: true,
  });

  useEffect(() => {
    // Auto-recover mic if it drops during the live voice session.
    if (micPending || micEnabled) return;
    const timer = window.setTimeout(() => {
      micButtonRef.current?.click();
    }, 900);
    return () => {
      window.clearTimeout(timer);
    };
  }, [micEnabled, micPending]);

  const onMicClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (buttonProps.onClick) {
      buttonProps.onClick(event);
    }
  };

  if (isMinimized) {
    return (
      <div className="agentPanel isMinimized">
        <div className="minimizedTopBar">
          <button className="modeToggleButton" type="button" onClick={onExpand}>
            Back to full layout
          </button>
        </div>

        <div className="minimizedRow" aria-label="Voice controls">
          <div className="minimizedBox orbBox">
            <VoiceBlob isAgentSpeaking={isAgentSpeaking} />
            <div className={`agentSignal ${isAgentSpeaking ? 'isActive' : ''}`} aria-live="polite">
              {isAgentSpeaking ? 'AI speaking' : 'Awaiting response'}
            </div>
          </div>

          <div className="minimizedBox micBox">
            <button
              {...buttonProps}
              ref={micButtonRef}
              className={`micButton ${micEnabled ? 'isOn' : 'isOff'}`}
              onClick={onMicClick}
              disabled={Boolean(buttonProps.disabled) || micPending}
              aria-label={micEnabled ? 'Microphone connected' : 'Reconnect microphone'}
            >
              <span className="micButtonRing" aria-hidden="true" />
              <span className="micButtonIcon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
                  <path
                    d="M12 14.5a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5.5a3 3 0 0 0 3 3Z"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M19 11.5a7 7 0 0 1-14 0"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 18.5v3"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.5 21.5h7"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            <div className="micHint">
              {micPending
                ? 'Starting microphone...'
                : micEnabled
                  ? 'Mic connected'
                  : 'Reconnecting microphone...'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`agentPanel ${isMinimized ? 'isMinimized' : ''}`}>
      <VoiceBlob isAgentSpeaking={isAgentSpeaking} />


      <div className="micRow pt-10" aria-label="Microphone controls">
        <button
          {...buttonProps}
          ref={micButtonRef}
          className={`micButton ${micEnabled ? 'isOn' : 'isOff'}`}
          onClick={onMicClick}
          disabled={Boolean(buttonProps.disabled) || micPending}
          aria-label={micEnabled ? 'Microphone connected' : 'Reconnect microphone'}
        >
          <span className="micButtonRing" aria-hidden="true" />
          <span className="micButtonIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
              <path
                d="M12 14.5a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5.5a3 3 0 0 0 3 3Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19 11.5a7 7 0 0 1-14 0"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 18.5v3"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.5 21.5h7"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>

        <div className="waveWrap" aria-label="Voice activity status">
          <div
            className={`agentSignal ${isAgentSpeaking ? 'isActive' : ''}`}
            aria-live="polite"
          >
            {isAgentSpeaking ? 'AI speaking' : 'Awaiting response'}
          </div>
        </div>
      </div>

      <div className="micHint">
        {micPending
          ? 'Starting microphone...'
          : micEnabled
            ? 'Mic connected'
            : 'Reconnecting microphone...'}
      </div>

      {!isMinimized ? (
        <div className="panelControls">
          <button className="modeToggleButton" type="button" onClick={onMinimize}>
            Minimize layout
          </button>
        </div>
      ) : null}
    </div>
  );
}

type ChatPanelProps = {
  onMinimize: () => void;
};

function ChatPanel({ onMinimize }: ChatPanelProps) {
  const agent = useAgent();
  const { localParticipant } = useLocalParticipant();
  const { chatMessages, send, isSending } = useChat();
  const transcriptions = useTranscriptions();
  const [draft, setDraft] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const endRef = useRef<HTMLDivElement | null>(null);

  const mergedMessages = useMemo<SummaryItem[]>(() => {
    const localIdentity = localParticipant?.identity;
    const chat = chatMessages.map((m) => {
      const fromIdentity = m.from?.identity;
      const isMine =
        fromIdentity && localIdentity ? fromIdentity === localIdentity : false;
      const fromLabel = m.from?.name || fromIdentity || (isMine ? 'You' : 'User');
      return {
        kind: 'chat' as const,
        id: `chat:${m.id}`,
        timestamp: m.timestamp,
        isMine,
        fromLabel,
        text: m.message,
      };
    });

    const transcript = transcriptions.map((t) => {
      const fromIdentity = t.participantInfo?.identity;
      const isMine =
        fromIdentity && localIdentity ? fromIdentity === localIdentity : false;
      const fromLabel = isMine ? 'You' : fromIdentity || 'Transcript';
      return {
        kind: 'transcript' as const,
        id: `tr:${t.streamInfo?.id ?? `${fromLabel}:${t.streamInfo?.timestamp ?? 0}`}`,
        timestamp: t.streamInfo?.timestamp ?? 0,
        isMine,
        fromLabel,
        text: t.text,
      };
    });

    return [...chat, ...transcript].sort((a, b) => a.timestamp - b.timestamp);
  }, [chatMessages, localParticipant?.identity, transcriptions]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [mergedMessages.length]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    await send(text);
    setDraft('');
  }

  const isOnline = agent.state !== 'failed';
  const subtitle = `${isOnline ? 'Online' : 'Offline'} / ${
    agent.canListen ? 'Listening' : 'Idle'
  }`;

  return (
    <div className={`chatPanel ${isOpen ? 'isOpen' : 'isCollapsed'}`}>
      <div className="chatHeader">
        <div className="chatHeaderLeft">
          <div className="chatHeaderTitle">Aria</div>
          <div className="chatHeaderSubtitle">
            <span
              className={`presenceDot ${isOnline ? 'isOnline' : 'isOffline'}`}
              aria-hidden="true"
            />
            {subtitle}
          </div>
        </div>
        <button
          className="iconButton chatCloseButton"
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-label={isOpen ? 'Close chat' : 'Open chat'}
        >
          {isOpen ? 'Close' : 'Open'}
        </button>
        <button className="iconButton chatCloseButton" type="button" onClick={onMinimize}>
          Minimize
        </button>
      </div>

      {isOpen ? (
        <>
          <div className="chatBody" role="log" aria-label="Messages">
            {mergedMessages.length === 0 ? (
              <div className="chatEmpty">Aria is ready. Ask anything about your study-abroad journey.</div>
            ) : (
              mergedMessages.map((m) => (
                <div
                  key={m.id}
                  className={`chatMsgRow ${m.isMine ? 'isMine' : 'isTheirs'}`}
                >
                  <div className="chatMsgMeta">
                    {m.kind === 'transcript' ? 'TRANSCRIPT' : 'MESSAGE'} • {m.fromLabel}
                  </div>
                  <div
                    className={`chatBubble ${m.kind === 'transcript' ? 'isTranscript' : ''}`}
                  >
                    {m.text}
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          <form className="chatComposer" onSubmit={onSubmit}>
            <input
              className="chatInput"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Type a message..."
              aria-label="Message"
            />
            <button
              className="sendButton"
              type="submit"
              disabled={isSending || draft.trim().length === 0}
              aria-label="Send message"
            >
              ➤
            </button>
          </form>
        </>
      ) : (
        <div className="chatCollapsed">
          <div className="chatCollapsedTitle">Chat closed</div>
          <div className="chatCollapsedText">Reopen the chat to continue.</div>
        </div>
      )}
    </div>
  );
}
